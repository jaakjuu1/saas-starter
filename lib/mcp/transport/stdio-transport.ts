/**
 * Stdio Transport for MCP
 * Handles communication with MCP servers via stdin/stdout
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { McpMessage, McpTransport, McpServerConfig } from '../protocol/types';

/**
 * Stdio Transport implementation
 */
export class StdioTransport extends EventEmitter implements McpTransport {
  private process: ChildProcess | null = null;
  private buffer = '';
  private messageHandlers: ((message: McpMessage) => void)[] = [];
  private closed = false;

  constructor(private config: McpServerConfig) {
    super();
  }

  /**
   * Start the MCP server process
   */
  async start(): Promise<void> {
    if (this.process) {
      throw new Error('Transport already started');
    }

    console.log(`[StdioTransport] Starting MCP server: ${this.config.name}`);

    // Spawn the process
    this.process = spawn(this.config.command, this.config.args || [], {
      env: {
        ...process.env,
        ...this.config.env,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Handle stdout (messages from server)
    this.process.stdout?.on('data', (data: Buffer) => {
      this.handleData(data.toString());
    });

    // Handle stderr (logging from server)
    this.process.stderr?.on('data', (data: Buffer) => {
      console.error(`[${this.config.name}] ${data.toString()}`);
    });

    // Handle process exit
    this.process.on('exit', (code, signal) => {
      console.log(`[${this.config.name}] Process exited with code ${code}, signal ${signal}`);
      this.closed = true;
      this.emit('close', code, signal);
    });

    // Handle process errors
    this.process.on('error', (error) => {
      console.error(`[${this.config.name}] Process error:`, error);
      this.emit('error', error);
    });

    // Wait for the process to be ready
    await this.waitForReady();
  }

  /**
   * Wait for the server to be ready
   */
  private async waitForReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Server ${this.config.name} failed to start`));
      }, 10000);

      // Listen for the first message or a specific ready signal
      const readyHandler = () => {
        clearTimeout(timeout);
        resolve();
      };

      // Assume server is ready when we can write to stdin
      if (this.process?.stdin?.writable) {
        readyHandler();
      } else {
        this.process?.stdin?.once('open', readyHandler);
      }
    });
  }

  /**
   * Handle incoming data from stdout
   */
  private handleData(data: string): void {
    this.buffer += data;
    
    // Try to extract complete messages
    // Messages are typically newline-delimited JSON
    const lines = this.buffer.split('\n');
    
    // Keep the last incomplete line in the buffer
    this.buffer = lines.pop() || '';
    
    // Process complete lines
    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line) as McpMessage;
          this.handleMessage(message);
        } catch (error) {
          console.error(`[${this.config.name}] Failed to parse message:`, line, error);
        }
      }
    }
  }

  /**
   * Handle a parsed message
   */
  private handleMessage(message: McpMessage): void {
    console.log(`[${this.config.name}] Received message:`, JSON.stringify(message, null, 2));
    
    // Notify all handlers
    for (const handler of this.messageHandlers) {
      try {
        handler(message);
      } catch (error) {
        console.error(`[${this.config.name}] Message handler error:`, error);
      }
    }
    
    // Emit as event
    this.emit('message', message);
  }

  /**
   * Send a message to the server
   */
  async send(message: McpMessage): Promise<void> {
    if (this.closed) {
      throw new Error(`Transport closed for ${this.config.name}`);
    }

    if (!this.process?.stdin?.writable) {
      throw new Error(`Cannot write to ${this.config.name} stdin`);
    }

    const data = JSON.stringify(message) + '\n';
    console.log(`[${this.config.name}] Sending message:`, JSON.stringify(message, null, 2));
    
    return new Promise((resolve, reject) => {
      this.process!.stdin!.write(data, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Register a message handler
   */
  onMessage(handler: (message: McpMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Remove a message handler
   */
  offMessage(handler: (message: McpMessage) => void): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index !== -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  /**
   * Close the transport
   */
  async close(): Promise<void> {
    if (this.closed) {
      return;
    }

    console.log(`[${this.config.name}] Closing transport`);
    this.closed = true;

    // Clear handlers
    this.messageHandlers = [];

    // Kill the process
    if (this.process) {
      this.process.kill('SIGTERM');
      
      // Give it time to close gracefully
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force kill if still running
      if (!this.process.killed) {
        this.process.kill('SIGKILL');
      }
      
      this.process = null;
    }
  }

  /**
   * Check if transport is closed
   */
  isClosed(): boolean {
    return this.closed;
  }

  /**
   * Get process information
   */
  getProcessInfo(): { pid?: number; killed?: boolean } | null {
    if (!this.process) {
      return null;
    }
    
    return {
      pid: this.process.pid,
      killed: this.process.killed,
    };
  }
}