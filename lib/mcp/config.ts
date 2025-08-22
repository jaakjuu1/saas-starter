/**
 * MCP (Model Context Protocol) Configuration for AI Website Analysis
 * 
 * This configuration defines the available MCP tools and their usage patterns
 * for different report tiers in our AI analysis workflow.
 */

export interface MCPToolConfig {
  name: string;
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  rateLimit?: {
    requests: number;
    window: number; // in milliseconds
  };
}

export interface ReportTierConfig {
  tools: string[];
  maxAnalysisTime: number; // in milliseconds
  promptTemplate: string;
  subAgents: string[];
}

// MCP Tool Configurations
export const MCP_TOOLS: Record<string, MCPToolConfig> = {
  firecrawl: {
    name: 'Firecrawl',
    enabled: true,
    apiKey: process.env.FIRECRAWL_API_KEY,
    baseUrl: 'https://api.firecrawl.dev',
    rateLimit: {
      requests: 100,
      window: 60000, // 1 minute
    },
  },
  playwright: {
    name: 'Playwright',
    enabled: true,
    rateLimit: {
      requests: 20,
      window: 60000, // 1 minute
    },
  },
  dataforseo: {
    name: 'DataForSEO',
    enabled: true,
    apiKey: process.env.DATAFORSEO_API_KEY,
    baseUrl: 'https://api.dataforseo.com',
    rateLimit: {
      requests: 50,
      window: 60000, // 1 minute
    },
  },
};

// Report Tier Configurations
export const REPORT_TIERS: Record<string, ReportTierConfig> = {
  lite: {
    tools: ['firecrawl'],
    maxAnalysisTime: 120000, // 2 minutes
    promptTemplate: 'lite-seo-analysis',
    subAgents: ['seo-analyzer'],
  },
  pro: {
    tools: ['firecrawl', 'playwright', 'dataforseo'],
    maxAnalysisTime: 300000, // 5 minutes
    promptTemplate: 'pro-technical-analysis',
    subAgents: ['seo-analyzer', 'ux-analyzer', 'performance-analyzer'],
  },
  elite: {
    tools: ['firecrawl', 'playwright', 'dataforseo'],
    maxAnalysisTime: 600000, // 10 minutes
    promptTemplate: 'elite-comprehensive-analysis',
    subAgents: ['seo-analyzer', 'ux-analyzer', 'performance-analyzer', 'competitor-analyzer'],
  },
  tasklist_pro: {
    tools: ['firecrawl', 'playwright', 'dataforseo'],
    maxAnalysisTime: 480000, // 8 minutes
    promptTemplate: 'tasklist-executive-analysis',
    subAgents: ['seo-analyzer', 'ux-analyzer', 'performance-analyzer', 'task-generator'],
  },
};

// Analysis Stage Definitions
export const ANALYSIS_STAGES = {
  initialization: { progress: 10, message: 'Initializing AI analysis engines...' },
  content_extraction: { progress: 25, message: 'Extracting website content and structure...' },
  visual_analysis: { progress: 40, message: 'Analyzing visual design and user experience...' },
  seo_audit: { progress: 55, message: 'Running comprehensive SEO analysis...' },
  performance_check: { progress: 70, message: 'Evaluating site performance and technical factors...' },
  competitor_research: { progress: 85, message: 'Researching competitors and market position...' },
  report_generation: { progress: 95, message: 'Generating personalized recommendations...' },
  finalization: { progress: 100, message: 'Analysis complete!' },
};

// Sub-Agent Configurations
export const SUB_AGENTS = {
  'seo-analyzer': {
    name: 'SEO Analysis Agent',
    description: 'Analyzes technical SEO, on-page optimization, and search performance',
    tools: ['firecrawl', 'dataforseo'],
    prompts: {
      lite: 'Analyze basic SEO fundamentals including meta tags, headings, and content structure',
      pro: 'Conduct detailed technical SEO audit with competitor keyword analysis',
      elite: 'Perform comprehensive SEO strategy analysis with advanced recommendations',
      tasklist_pro: 'Generate prioritized SEO action items with implementation timelines'
    }
  },
  'ux-analyzer': {
    name: 'UX Analysis Agent',
    description: 'Evaluates user experience, design patterns, and conversion optimization',
    tools: ['playwright', 'firecrawl'],
    prompts: {
      pro: 'Analyze user interface design and basic conversion elements',
      elite: 'Comprehensive UX audit with advanced conversion optimization strategies',
      tasklist_pro: 'Create UX improvement tasks with priority and effort estimates'
    }
  },
  'performance-analyzer': {
    name: 'Performance Analysis Agent',
    description: 'Assesses site speed, Core Web Vitals, and technical performance',
    tools: ['playwright'],
    prompts: {
      pro: 'Evaluate Core Web Vitals and basic performance metrics',
      elite: 'Detailed performance analysis with optimization recommendations',
      tasklist_pro: 'Generate performance improvement tasks with technical specifications'
    }
  },
  'competitor-analyzer': {
    name: 'Competitive Analysis Agent',
    description: 'Researches competitor strategies and market positioning',
    tools: ['dataforseo', 'firecrawl'],
    prompts: {
      elite: 'Analyze competitor SEO strategies and identify opportunities',
      tasklist_pro: 'Create competitive strategy tasks based on market analysis'
    }
  },
  'task-generator': {
    name: 'Task Generation Agent',
    description: 'Converts analysis insights into actionable tasks with priorities',
    tools: [],
    prompts: {
      tasklist_pro: 'Transform analysis findings into prioritized, actionable tasks with ROI estimates'
    }
  }
};

// Validation functions
export function validateTierConfig(tier: string): boolean {
  return tier in REPORT_TIERS;
}

export function getToolsForTier(tier: string): string[] {
  if (!validateTierConfig(tier)) {
    throw new Error(`Invalid report tier: ${tier}`);
  }
  return REPORT_TIERS[tier].tools;
}

export function getSubAgentsForTier(tier: string): string[] {
  if (!validateTierConfig(tier)) {
    throw new Error(`Invalid report tier: ${tier}`);
  }
  return REPORT_TIERS[tier].subAgents;
}

export function getMaxAnalysisTime(tier: string): number {
  if (!validateTierConfig(tier)) {
    throw new Error(`Invalid report tier: ${tier}`);
  }
  return REPORT_TIERS[tier].maxAnalysisTime;
}