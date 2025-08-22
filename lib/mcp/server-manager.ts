/**
 * MCP Server Manager
 * Manages lifecycle of multiple MCP servers
 */

import { StdioTransport } from './transport/stdio-transport';
import { McpServerConfig } from './protocol/types';
import { EventEmitter } from 'events';

/**
 * Server instance with transport and metadata
 */
interface ServerInstance {
  config: McpServerConfig;
  transport: StdioTransport;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  startTime?: Date;
  error?: Error;
}

/**
 * MCP Server Manager
 */
export class McpServerManager extends EventEmitter {
  private servers = new Map<string, ServerInstance>();
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(private configs: McpServerConfig[]) {
    super();
  }

  /**
   * Start all configured servers
   */
  async startAll(): Promise<void> {
    console.log('[ServerManager] Starting all MCP servers...');
    
    const startPromises = this.configs.map(config => this.startServer(config));
    const results = await Promise.allSettled(startPromises);
    
    // Check for failures
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error('[ServerManager] Some servers failed to start:', failures);
      // Continue with servers that started successfully
    }
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    console.log(`[ServerManager] Started ${this.servers.size}/${this.configs.length} servers`);
  }

  /**
   * Start a single server
   */
  async startServer(config: McpServerConfig): Promise<void> {
    if (this.servers.has(config.name)) {
      console.warn(`[ServerManager] Server ${config.name} already exists`);
      return;
    }

    console.log(`[ServerManager] Starting server: ${config.name}`);
    
    const transport = new StdioTransport(config);
    const instance: ServerInstance = {
      config,
      transport,
      status: 'starting',
    };
    
    this.servers.set(config.name, instance);
    
    try {
      // Set up event handlers
      transport.on('error', (error) => {
        console.error(`[ServerManager] Server ${config.name} error:`, error);
        instance.status = 'error';
        instance.error = error;
        this.emit('server-error', config.name, error);
      });
      
      transport.on('close', (code, signal) => {
        console.log(`[ServerManager] Server ${config.name} closed (code: ${code}, signal: ${signal})`);
        const wasRunning = instance.status === 'running';
        instance.status = 'stopped';
        this.emit('server-closed', config.name, code, signal);
        
        // Auto-restart if unexpected closure and was running
        if (code !== 0 && wasRunning && instance.status !== 'stopping') {
          console.log(`[ServerManager] Attempting to restart ${config.name}...`);
          this.restartServer(config.name).catch(console.error);
        }
      });
      
      // Start the transport
      await transport.start();
      
      instance.status = 'running';
      instance.startTime = new Date();
      
      console.log(`[ServerManager] Server ${config.name} started successfully`);
      this.emit('server-started', config.name);
      
    } catch (error) {
      console.error(`[ServerManager] Failed to start server ${config.name}:`, error);
      instance.status = 'error';
      instance.error = error as Error;
      this.servers.delete(config.name);
      throw error;
    }
  }

  /**
   * Stop a single server
   */
  async stopServer(name: string): Promise<void> {
    const instance = this.servers.get(name);
    if (!instance) {
      console.warn(`[ServerManager] Server ${name} not found`);
      return;
    }

    if (instance.status === 'stopped' || instance.status === 'stopping') {
      return;
    }

    console.log(`[ServerManager] Stopping server: ${name}`);
    instance.status = 'stopping';
    
    try {
      await instance.transport.close();
      instance.status = 'stopped';
      this.servers.delete(name);
      console.log(`[ServerManager] Server ${name} stopped`);
      this.emit('server-stopped', name);
    } catch (error) {
      console.error(`[ServerManager] Error stopping server ${name}:`, error);
      throw error;
    }
  }

  /**
   * Restart a server
   */
  async restartServer(name: string): Promise<void> {
    const instance = this.servers.get(name);
    if (!instance) {
      throw new Error(`Server ${name} not found`);
    }

    const config = instance.config;
    
    // Stop the server
    await this.stopServer(name);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Start it again
    await this.startServer(config);
  }

  /**
   * Stop all servers
   */
  async stopAll(): Promise<void> {
    console.log('[ServerManager] Stopping all MCP servers...');
    
    // Stop health monitoring
    this.stopHealthMonitoring();
    
    const stopPromises = Array.from(this.servers.keys()).map(name => this.stopServer(name));
    await Promise.allSettled(stopPromises);
    
    console.log('[ServerManager] All servers stopped');
  }

  /**
   * Get a server instance
   */
  getServer(name: string): ServerInstance | undefined {
    return this.servers.get(name);
  }

  /**
   * Get transport for a server
   */
  getTransport(name: string): StdioTransport | undefined {
    return this.servers.get(name)?.transport;
  }

  /**
   * Get all server names
   */
  getServerNames(): string[] {
    return Array.from(this.servers.keys());
  }

  /**
   * Get server status
   */
  getServerStatus(name: string): string | undefined {
    return this.servers.get(name)?.status;
  }

  /**
   * Get all server statuses
   */
  getAllStatuses(): Record<string, string> {
    const statuses: Record<string, string> = {};
    for (const [name, instance] of this.servers) {
      statuses[name] = instance.status;
    }
    return statuses;
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      return;
    }

    this.healthCheckInterval = setInterval(() => {
      for (const [name, instance] of this.servers) {
        if (instance.status === 'running') {
          const processInfo = instance.transport.getProcessInfo();
          if (processInfo?.killed || instance.transport.isClosed()) {
            console.warn(`[ServerManager] Server ${name} appears to be dead`);
            instance.status = 'error';
            this.emit('server-unhealthy', name);
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Check if all servers are running
   */
  allServersRunning(): boolean {
    if (this.servers.size !== this.configs.length) {
      return false;
    }
    
    for (const instance of this.servers.values()) {
      if (instance.status !== 'running') {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get health report
   */
  getHealthReport(): {
    total: number;
    running: number;
    stopped: number;
    error: number;
    servers: Record<string, {
      status: string;
      uptime?: number;
      error?: string;
    }>;
  } {
    const report = {
      total: this.servers.size,
      running: 0,
      stopped: 0,
      error: 0,
      servers: {} as Record<string, any>,
    };
    
    for (const [name, instance] of this.servers) {
      if (instance.status === 'running') report.running++;
      else if (instance.status === 'stopped') report.stopped++;
      else if (instance.status === 'error') report.error++;
      
      report.servers[name] = {
        status: instance.status,
        uptime: instance.startTime ? Date.now() - instance.startTime.getTime() : undefined,
        error: instance.error?.message,
      };
    }
    
    return report;
  }
}