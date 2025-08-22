/**
 * MCP Protocol Types
 * Defines JSON-RPC 2.0 and MCP-specific types
 */

/**
 * JSON-RPC 2.0 Request
 */
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id?: string | number | null;
}

/**
 * JSON-RPC 2.0 Response
 */
export interface JsonRpcResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: JsonRpcError;
  id: string | number | null;
}

/**
 * JSON-RPC 2.0 Error
 */
export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

/**
 * JSON-RPC 2.0 Notification (no id, no response expected)
 */
export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: any;
}

/**
 * Standard JSON-RPC 2.0 error codes
 */
export enum JsonRpcErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  ServerError = -32000, // -32000 to -32099
}

/**
 * MCP Protocol specific types
 */

/**
 * MCP Tool Definition
 */
export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

/**
 * MCP Initialize Request
 */
export interface McpInitializeRequest {
  protocolVersion: string;
  capabilities?: {
    tools?: boolean;
    prompts?: boolean;
    resources?: boolean;
  };
  clientInfo?: {
    name: string;
    version: string;
  };
}

/**
 * MCP Initialize Response
 */
export interface McpInitializeResponse {
  protocolVersion: string;
  capabilities?: {
    tools?: boolean;
    prompts?: boolean;
    resources?: boolean;
  };
  serverInfo?: {
    name: string;
    version: string;
  };
}

/**
 * MCP Tool List Request
 */
export interface McpToolListRequest {
  // No specific params needed
}

/**
 * MCP Tool List Response
 */
export interface McpToolListResponse {
  tools: McpTool[];
}

/**
 * MCP Tool Call Request
 */
export interface McpToolCallRequest {
  name: string;
  arguments?: any;
}

/**
 * MCP Tool Call Response
 */
export interface McpToolCallResponse {
  content: any[];
  isError?: boolean;
}

/**
 * MCP Server Configuration
 */
export interface McpServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  transport?: 'stdio' | 'http' | 'sse';
  url?: string; // For HTTP/SSE transports
}

/**
 * MCP Message Types
 */
export type McpMessage = JsonRpcRequest | JsonRpcResponse | JsonRpcNotification;

/**
 * MCP Transport Interface
 */
export interface McpTransport {
  send(message: McpMessage): Promise<void>;
  onMessage(handler: (message: McpMessage) => void): void;
  close(): Promise<void>;
}