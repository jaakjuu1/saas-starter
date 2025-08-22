/**
 * MCP Configuration Loader
 * Loads and processes MCP server configurations
 */

import fs from 'fs';
import path from 'path';
import { McpServerConfig } from './protocol/types';

/**
 * Load MCP configuration from file
 */
export function loadMcpConfig(configPath?: string): { mcpServers: Record<string, McpServerConfig> } {
  // Default to .mcp.json in project root
  const filePath = configPath || path.join(process.cwd(), '.mcp.json');
  
  if (!fs.existsSync(filePath)) {
    console.warn(`[ConfigLoader] MCP config file not found at ${filePath}`);
    return { mcpServers: {} };
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const config = JSON.parse(content);
    
    if (!config.mcpServers) {
      console.warn('[ConfigLoader] No mcpServers defined in config');
      return { mcpServers: {} };
    }
    
    // Convert to record of McpServerConfig with environment variable expansion
    const mcpServers: Record<string, McpServerConfig> = {};
    
    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      const server = serverConfig as any;
      
      mcpServers[name] = {
        name,
        command: server.command,
        args: server.args || [],
        env: expandEnvironmentVariables(server.env || {}),
        transport: server.transport || 'stdio',
        url: server.url,
      };
    }
    
    console.log(`[ConfigLoader] Loaded ${Object.keys(mcpServers).length} MCP server configurations`);
    return { mcpServers };
    
  } catch (error) {
    console.error('[ConfigLoader] Failed to load MCP config:', error);
    return { mcpServers: {} };
  }
}

/**
 * Expand environment variables in configuration
 */
function expandEnvironmentVariables(env: Record<string, string>): Record<string, string> {
  const expanded: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(env)) {
    // Replace ${VAR} with process.env.VAR
    expanded[key] = value.replace(/\$\{(\w+)\}/g, (match, varName) => {
      const envValue = process.env[varName];
      if (!envValue) {
        console.warn(`[ConfigLoader] Environment variable ${varName} not found`);
        return match; // Keep original if not found
      }
      return envValue;
    });
  }
  
  return expanded;
}

/**
 * Get tier-specific MCP server configuration
 */
export function getMcpServersForTier(tier: string): string[] {
  switch (tier) {
    case 'lite':
      return ['firecrawl'];
    case 'pro':
      return ['firecrawl', 'playwright'];
    case 'elite':
      return ['firecrawl', 'playwright', 'dataforseo'];
    case 'tasklist_pro':
      return ['firecrawl', 'playwright', 'dataforseo'];
    default:
      return ['firecrawl'];
  }
}

/**
 * Validate MCP server availability
 */
export function validateMcpServers(configs: McpServerConfig[]): {
  valid: boolean;
  missing: string[];
  errors: string[];
} {
  const result = {
    valid: true,
    missing: [] as string[],
    errors: [] as string[],
  };
  
  // Check required servers
  const requiredServers = ['firecrawl', 'playwright', 'dataforseo'];
  const configuredServers = configs.map(c => c.name);
  
  for (const required of requiredServers) {
    if (!configuredServers.includes(required)) {
      result.missing.push(required);
      result.valid = false;
    }
  }
  
  // Check environment variables
  for (const config of configs) {
    if (config.name === 'firecrawl' && !process.env.FIRECRAWL_API_KEY) {
      result.errors.push('FIRECRAWL_API_KEY not set');
      result.valid = false;
    }
    
    if (config.name === 'dataforseo') {
      if (!process.env.DATAFORSEO_LOGIN) {
        result.errors.push('DATAFORSEO_LOGIN not set');
        result.valid = false;
      }
      if (!process.env.DATAFORSEO_PASSWORD) {
        result.errors.push('DATAFORSEO_PASSWORD not set');
        result.valid = false;
      }
    }
  }
  
  return result;
}

/**
 * Get default MCP server configurations
 */
export function getDefaultMcpConfigs(): McpServerConfig[] {
  return [
    {
      name: 'firecrawl',
      command: 'npx',
      args: ['firecrawl-mcp'],
      env: {
        FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || '',
        FIRECRAWL_ENABLE_RETRIES: 'true',
        FIRECRAWL_MAX_RETRIES: '3',
      },
      transport: 'stdio',
    },
    {
      name: 'playwright',
      command: 'npx',
      args: ['@playwright/mcp@latest'],
      env: {},
      transport: 'stdio',
    },
    {
      name: 'dataforseo',
      command: 'npx',
      args: ['dataforseo-mcp-server'],
      env: {
        DATAFORSEO_LOGIN: process.env.DATAFORSEO_LOGIN || '',
        DATAFORSEO_PASSWORD: process.env.DATAFORSEO_PASSWORD || '',
      },
      transport: 'stdio',
    },
  ];
}