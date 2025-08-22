/**
 * JSON-RPC 2.0 Protocol Handler for MCP
 * Handles message formatting, parsing, and correlation
 */

import {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
  JsonRpcError,
  JsonRpcErrorCode,
  McpMessage,
} from './types';

/**
 * JSON-RPC Protocol Handler
 */
export class JsonRpcProtocol {
  private requestId = 0;
  private pendingRequests = new Map<string | number, {
    resolve: (result: any) => void;
    reject: (error: Error) => void;
    timeout?: NodeJS.Timeout;
  }>();

  /**
   * Create a JSON-RPC request
   */
  createRequest(method: string, params?: any): JsonRpcRequest {
    const id = ++this.requestId;
    return {
      jsonrpc: '2.0',
      method,
      params,
      id,
    };
  }

  /**
   * Create a JSON-RPC notification (no response expected)
   */
  createNotification(method: string, params?: any): JsonRpcNotification {
    return {
      jsonrpc: '2.0',
      method,
      params,
    };
  }

  /**
   * Create a JSON-RPC response
   */
  createResponse(id: string | number | null, result?: any, error?: JsonRpcError): JsonRpcResponse {
    const response: JsonRpcResponse = {
      jsonrpc: '2.0',
      id,
    };

    if (error) {
      response.error = error;
    } else {
      response.result = result ?? null;
    }

    return response;
  }

  /**
   * Create a JSON-RPC error
   */
  createError(code: JsonRpcErrorCode, message: string, data?: any): JsonRpcError {
    return {
      code,
      message,
      data,
    };
  }

  /**
   * Parse a JSON-RPC message
   */
  parseMessage(data: string): McpMessage | McpMessage[] {
    try {
      const parsed = JSON.parse(data);
      
      // Handle batch requests
      if (Array.isArray(parsed)) {
        return parsed.map(msg => this.validateMessage(msg));
      }
      
      return this.validateMessage(parsed);
    } catch (error) {
      throw new Error(`Invalid JSON-RPC message: ${error}`);
    }
  }

  /**
   * Validate a parsed JSON-RPC message
   */
  private validateMessage(msg: any): McpMessage {
    if (msg.jsonrpc !== '2.0') {
      throw new Error('Invalid JSON-RPC version');
    }

    // It's a request or notification
    if ('method' in msg) {
      if (typeof msg.method !== 'string') {
        throw new Error('Invalid method');
      }
      
      // It's a notification if no id
      if (!('id' in msg)) {
        return msg as JsonRpcNotification;
      }
      
      return msg as JsonRpcRequest;
    }

    // It's a response
    if ('id' in msg) {
      if (!('result' in msg) && !('error' in msg)) {
        throw new Error('Response must have result or error');
      }
      return msg as JsonRpcResponse;
    }

    throw new Error('Invalid JSON-RPC message structure');
  }

  /**
   * Send a request and wait for response
   */
  async sendRequest(
    method: string,
    params: any,
    sendFn: (message: McpMessage) => Promise<void>,
    timeout = 30000
  ): Promise<any> {
    const request = this.createRequest(method, params);
    
    // Create promise for response
    const promise = new Promise<any>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(request.id!);
        reject(new Error(`Request timeout: ${method}`));
      }, timeout);

      this.pendingRequests.set(request.id!, {
        resolve,
        reject,
        timeout: timeoutHandle,
      });
    });

    // Send the request
    await sendFn(request);

    return promise;
  }

  /**
   * Send a notification (fire and forget)
   */
  async sendNotification(
    method: string,
    params: any,
    sendFn: (message: McpMessage) => Promise<void>
  ): Promise<void> {
    const notification = this.createNotification(method, params);
    await sendFn(notification);
  }

  /**
   * Handle an incoming response
   */
  handleResponse(response: JsonRpcResponse): void {
    const pending = this.pendingRequests.get(response.id!);
    if (!pending) {
      console.warn(`No pending request for response id: ${response.id}`);
      return;
    }

    // Clear timeout
    if (pending.timeout) {
      clearTimeout(pending.timeout);
    }

    // Remove from pending
    this.pendingRequests.delete(response.id!);

    // Resolve or reject based on response
    if (response.error) {
      pending.reject(new Error(`${response.error.message} (${response.error.code})`));
    } else {
      pending.resolve(response.result);
    }
  }

  /**
   * Handle batch messages
   */
  handleBatch(messages: McpMessage[]): McpMessage[] {
    const responses: McpMessage[] = [];
    
    for (const message of messages) {
      if (this.isResponse(message)) {
        this.handleResponse(message as JsonRpcResponse);
      }
      // Handle requests/notifications as needed
    }
    
    return responses;
  }

  /**
   * Check if a message is a response
   */
  isResponse(message: McpMessage): boolean {
    return 'id' in message && ('result' in message || 'error' in message);
  }

  /**
   * Check if a message is a request
   */
  isRequest(message: McpMessage): boolean {
    return 'method' in message && 'id' in message;
  }

  /**
   * Check if a message is a notification
   */
  isNotification(message: McpMessage): boolean {
    return 'method' in message && !('id' in message);
  }

  /**
   * Serialize a message for transport
   */
  serialize(message: McpMessage | McpMessage[]): string {
    return JSON.stringify(message);
  }

  /**
   * Clear all pending requests
   */
  clearPending(): void {
    for (const [id, pending] of this.pendingRequests) {
      if (pending.timeout) {
        clearTimeout(pending.timeout);
      }
      pending.reject(new Error('Protocol handler cleared'));
    }
    this.pendingRequests.clear();
  }
}