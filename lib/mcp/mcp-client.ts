/**
 * Generic MCP Client
 * Provides a high-level interface for communicating with MCP servers
 */

import { JsonRpcProtocol } from './protocol/json-rpc';
import { StdioTransport } from './transport/stdio-transport';
import {
  McpServerConfig,
  McpTool,
  McpMessage,
  McpInitializeRequest,
  McpInitializeResponse,
  McpToolListResponse,
  McpToolCallRequest,
  McpToolCallResponse,
  JsonRpcResponse,
} from './protocol/types';

/**
 * MCP Client options
 */
export interface McpClientOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * MCP Client
 */
export class McpClient {
  private protocol: JsonRpcProtocol;
  private transport: StdioTransport | null = null;
  private initialized = false;
  private tools: McpTool[] = [];
  private serverInfo?: any;

  constructor(
    private config: McpServerConfig,
    private options: McpClientOptions = {}
  ) {
    this.protocol = new JsonRpcProtocol();
    this.options = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...options,
    };
  }

  /**
   * Initialize the MCP client and connect to server
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log(`[McpClient] Already initialized for ${this.config.name}`);
      return;
    }

    console.log(`[McpClient] Initializing client for ${this.config.name}`);

    try {
      // Create and start transport
      this.transport = new StdioTransport(this.config);
      
      // Set up message handler
      this.transport.onMessage((message: McpMessage) => {
        if (this.protocol.isResponse(message)) {
          this.protocol.handleResponse(message as JsonRpcResponse);
        }
      });
      
      // Start the transport
      await this.transport.start();
      
      // Send initialize request
      const initRequest: McpInitializeRequest = {
        protocolVersion: '1.0',
        capabilities: {
          tools: true,
          prompts: true,
          resources: true,
        },
        clientInfo: {
          name: 'saas-seo-ai',
          version: '1.0.0',
        },
      };
      
      const initResponse = await this.sendRequest('initialize', initRequest);
      this.serverInfo = initResponse as McpInitializeResponse;
      
      console.log(`[McpClient] Initialized with server:`, this.serverInfo);
      
      // Mark as initialized
      await this.sendNotification('initialized', {});
      
      // List available tools
      await this.refreshTools();
      
      this.initialized = true;
      console.log(`[McpClient] Client initialized for ${this.config.name}`);
      
    } catch (error) {
      console.error(`[McpClient] Failed to initialize ${this.config.name}:`, error);
      await this.close();
      throw error;
    }
  }

  /**
   * List available tools from the server
   */
  async listTools(): Promise<McpTool[]> {
    if (!this.initialized) {
      throw new Error(`Client not initialized for ${this.config.name}`);
    }
    
    return this.tools;
  }

  /**
   * Refresh the tools list from server
   */
  async refreshTools(): Promise<void> {
    console.log(`[McpClient] Refreshing tools for ${this.config.name}`);
    
    try {
      const response = await this.sendRequest('tools/list', {});
      const toolsResponse = response as McpToolListResponse;
      this.tools = toolsResponse.tools || [];
      
      console.log(`[McpClient] Found ${this.tools.length} tools:`, this.tools.map(t => t.name));
    } catch (error) {
      console.error(`[McpClient] Failed to list tools:`, error);
      this.tools = [];
    }
  }

  /**
   * Call a tool on the server
   */
  async callTool(toolName: string, args?: any): Promise<any> {
    if (!this.initialized) {
      throw new Error(`Client not initialized for ${this.config.name}`);
    }

    console.log(`[McpClient] Calling tool ${toolName} with args:`, args);
    
    // Check if tool exists
    const tool = this.tools.find(t => t.name === toolName);
    if (!tool) {
      console.warn(`[McpClient] Tool ${toolName} not found in ${this.config.name}`);
      // Continue anyway - server might have new tools
    }
    
    const request: McpToolCallRequest = {
      name: toolName,
      arguments: args,
    };
    
    try {
      const response = await this.sendRequestWithRetry('tools/call', request);
      const toolResponse = response as McpToolCallResponse;
      
      if (toolResponse.isError) {
        throw new Error(`Tool error: ${JSON.stringify(toolResponse.content)}`);
      }
      
      return toolResponse.content;
    } catch (error) {
      console.error(`[McpClient] Tool call failed for ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Send a request to the server
   */
  private async sendRequest(method: string, params: any): Promise<any> {
    if (!this.transport) {
      throw new Error('Transport not initialized');
    }
    
    return this.protocol.sendRequest(
      method,
      params,
      (message) => this.transport!.send(message),
      this.options.timeout
    );
  }

  /**
   * Send a request with retry logic
   */
  private async sendRequestWithRetry(method: string, params: any): Promise<any> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.options.retryAttempts!; attempt++) {
      try {
        return await this.sendRequest(method, params);
      } catch (error) {
        lastError = error as Error;
        console.warn(`[McpClient] Request failed (attempt ${attempt}/${this.options.retryAttempts}):`, error);
        
        if (attempt < this.options.retryAttempts!) {
          await new Promise(resolve => setTimeout(resolve, this.options.retryDelay! * attempt));
        }
      }
    }
    
    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Send a notification to the server
   */
  private async sendNotification(method: string, params: any): Promise<void> {
    if (!this.transport) {
      throw new Error('Transport not initialized');
    }
    
    return this.protocol.sendNotification(
      method,
      params,
      (message) => this.transport!.send(message)
    );
  }

  /**
   * Close the client
   */
  async close(): Promise<void> {
    console.log(`[McpClient] Closing client for ${this.config.name}`);
    
    this.initialized = false;
    this.tools = [];
    this.serverInfo = undefined;
    
    // Clear pending requests
    this.protocol.clearPending();
    
    // Close transport
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
  }

  /**
   * Check if client is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get server information
   */
  getServerInfo(): any {
    return this.serverInfo;
  }

  /**
   * Get server name
   */
  getServerName(): string {
    return this.config.name;
  }

  /**
   * Call a tool with structured validation
   */
  async callToolSafe(toolName: string, args?: any): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      const result = await this.callTool(toolName, args);
      return { success: true, result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Batch call multiple tools
   */
  async callToolsBatch(calls: Array<{ tool: string; args?: any }>): Promise<any[]> {
    const results = await Promise.allSettled(
      calls.map(call => this.callTool(call.tool, call.args))
    );
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return { success: true, tool: calls[index].tool, result: result.value };
      } else {
        return { success: false, tool: calls[index].tool, error: result.reason };
      }
    });
  }
}