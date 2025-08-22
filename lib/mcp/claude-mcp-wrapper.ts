/**
 * Claude MCP Wrapper
 * Orchestrates Anthropic Claude API with MCP tool integrations
 * Provides high-level interface for AI analysis with real tool data
 */

import Anthropic from '@anthropic-ai/sdk';
import { McpServerManager } from './server-manager';
import { FirecrawlClient } from './tools/firecrawl-client';
import { PlaywrightClient } from './tools/playwright-client';
import { DataForSeoClient } from './tools/dataforseo-client';
import { loadMcpConfig, getMcpServersForTier } from './config-loader';
import { McpServerConfig } from './protocol/types';

/**
 * Analysis context with real tool data
 */
export interface AnalysisContext {
  website: {
    url: string;
    content?: string;
    title?: string;
    description?: string;
    headings?: Record<string, string[]>;
    links?: { internal: string[]; external: string[] };
    images?: { src: string; alt?: string }[];
  };
  seo?: {
    issues?: any[];
    score?: number;
    recommendations?: string[];
    keywords?: any[];
    competitors?: any[];
  };
  ux?: {
    screenshot?: string;
    accessibility?: any;
    performance?: any;
    mobile?: any;
  };
  tier: string;
}

/**
 * Analysis result from Claude with tool-enhanced data
 */
export interface AnalysisResult {
  analysis: string;
  recommendations: string[];
  score?: number;
  issues?: any[];
  context: AnalysisContext;
  toolsUsed: string[];
  processingTime: number;
}

/**
 * Progress callback for real-time updates
 */
export type ProgressCallback = (stage: string, progress: number, message: string) => void;

/**
 * Claude MCP Wrapper - Orchestrates AI analysis with real tools
 */
export class ClaudeMcpWrapper {
  private anthropic: Anthropic;
  private serverManager: McpServerManager | null = null;
  private firecrawlClient: FirecrawlClient | null = null;
  private playwrightClient: PlaywrightClient | null = null;
  private dataForSeoClient: DataForSeoClient | null = null;
  private initialized = false;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
  }

  /**
   * Initialize MCP servers for a specific tier
   */
  async initialize(tier: string): Promise<void> {
    console.log(`[ClaudeMcpWrapper] Initializing for tier: ${tier}`);
    
    // Load MCP configuration
    const mcpConfig = await loadMcpConfig();
    const requiredServers = getMcpServersForTier(tier);
    
    // Filter configs to only include required servers
    const configs: McpServerConfig[] = requiredServers
      .map(serverName => {
        const serverConfig = mcpConfig.mcpServers[serverName];
        if (!serverConfig) {
          console.warn(`[ClaudeMcpWrapper] Server config not found: ${serverName}`);
          return null;
        }
        return serverConfig;
      })
      .filter((config): config is McpServerConfig => config !== null);

    if (configs.length === 0) {
      throw new Error(`No MCP servers configured for tier: ${tier}`);
    }

    // Initialize server manager
    this.serverManager = new McpServerManager(configs);
    
    // Start all required servers
    await this.serverManager.startAll();
    
    // Initialize tool clients for running servers
    await this.initializeToolClients();
    
    this.initialized = true;
    console.log(`[ClaudeMcpWrapper] Initialized with ${configs.length} servers`);
  }

  /**
   * Initialize tool clients based on running servers
   */
  private async initializeToolClients(): Promise<void> {
    if (!this.serverManager) return;
    
    const runningServers = this.serverManager.getServerNames();
    
    for (const serverName of runningServers) {
      const transport = this.serverManager.getTransport(serverName);
      if (!transport) continue;

      try {
        // Create MCP client for this transport
        const serverInstance = this.serverManager.getServer(serverName);
        if (!serverInstance) continue;

        const mcpClient = new (await import('./mcp-client')).McpClient(serverInstance.config);
        await mcpClient.initialize();

        switch (serverName) {
          case 'firecrawl':
            this.firecrawlClient = new FirecrawlClient(mcpClient);
            console.log('[ClaudeMcpWrapper] Firecrawl client initialized');
            break;
            
          case 'playwright':
            this.playwrightClient = new PlaywrightClient(mcpClient);
            console.log('[ClaudeMcpWrapper] Playwright client initialized');
            break;
            
          case 'dataforseo':
            this.dataForSeoClient = new DataForSeoClient(mcpClient);
            console.log('[ClaudeMcpWrapper] DataForSEO client initialized');
            break;
        }
      } catch (error) {
        console.error(`[ClaudeMcpWrapper] Failed to initialize ${serverName} client:`, error);
        // Continue with other clients - graceful degradation
      }
    }
  }

  /**
   * Perform comprehensive website analysis with real tool data
   */
  async analyzeWebsite(
    url: string,
    tier: string,
    prompt: string,
    progressCallback?: ProgressCallback
  ): Promise<AnalysisResult> {
    if (!this.initialized) {
      throw new Error('ClaudeMcpWrapper not initialized. Call initialize() first.');
    }

    const startTime = Date.now();
    const toolsUsed: string[] = [];

    progressCallback?.('initialization', 10, 'Starting website analysis...');

    // Build analysis context with real tool data
    const context: AnalysisContext = {
      website: { url },
      tier,
    };

    try {
      // Step 1: Web scraping with Firecrawl (all tiers)
      if (this.firecrawlClient) {
        progressCallback?.('scraping', 25, 'Extracting website content...');
        
        const scrapedData = await this.firecrawlClient.scrapeForSEO(url);
        context.website = { ...context.website, ...scrapedData };
        toolsUsed.push('firecrawl');
        
        console.log('[ClaudeMcpWrapper] Website content extracted');
      }

      // Step 2: Visual/UX analysis with Playwright (pro+ tiers)
      if (this.playwrightClient && ['pro', 'elite', 'tasklist_pro'].includes(tier)) {
        progressCallback?.('ux_analysis', 50, 'Analyzing user experience...');
        
        const uxData = await this.playwrightClient.analyzeUX(url);
        context.ux = uxData;
        toolsUsed.push('playwright');
        
        console.log('[ClaudeMcpWrapper] UX analysis completed');
      }

      // Step 3: SEO data with DataForSEO (elite+ tiers)
      if (this.dataForSeoClient && ['elite', 'tasklist_pro'].includes(tier)) {
        progressCallback?.('seo_analysis', 75, 'Performing technical SEO audit...');
        
        const seoData = await this.dataForSeoClient.getTechnicalAudit(url);
        context.seo = seoData;
        toolsUsed.push('dataforseo');
        
        console.log('[ClaudeMcpWrapper] SEO analysis completed');
      }

      // Step 4: AI analysis with Claude using real tool data
      progressCallback?.('ai_analysis', 90, 'Generating AI analysis...');
      
      const analysisResult = await this.performClaudeAnalysis(context, prompt);
      
      progressCallback?.('completion', 100, 'Analysis complete!');

      const processingTime = Date.now() - startTime;

      return {
        ...analysisResult,
        context,
        toolsUsed,
        processingTime,
      };

    } catch (error) {
      console.error('[ClaudeMcpWrapper] Analysis failed:', error);
      
      // Fallback: Basic analysis with available data
      progressCallback?.('fallback', 95, 'Generating fallback analysis...');
      
      const fallbackResult = await this.performFallbackAnalysis(context, prompt, error as Error);
      
      const processingTime = Date.now() - startTime;

      return {
        ...fallbackResult,
        context,
        toolsUsed,
        processingTime,
      };
    }
  }

  /**
   * Perform AI analysis with Claude using real tool data
   */
  private async performClaudeAnalysis(
    context: AnalysisContext,
    prompt: string
  ): Promise<Omit<AnalysisResult, 'context' | 'toolsUsed' | 'processingTime'>> {
    
    // Prepare tool data summary for Claude
    const toolDataSummary = this.buildToolDataSummary(context);
    
    // Construct enhanced prompt with real data
    const enhancedPrompt = `
${prompt}

## Real Tool Data Analysis

${toolDataSummary}

Based on this real data collected from live tools, provide a comprehensive analysis following the requested format. Focus on actionable insights derived from the actual tool data rather than generic recommendations.
`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: enhancedPrompt,
          },
        ],
      });

      const analysisText = response.content[0]?.type === 'text' 
        ? response.content[0].text 
        : 'Analysis unavailable';

      // Extract structured data from Claude's response
      const recommendations = this.extractRecommendations(analysisText);
      const score = this.extractScore(analysisText);
      const issues = this.extractIssues(analysisText, context);

      return {
        analysis: analysisText,
        recommendations,
        score,
        issues,
      };

    } catch (error) {
      console.error('[ClaudeMcpWrapper] Claude API error:', error);
      throw new Error(`AI analysis failed: ${error}`);
    }
  }

  /**
   * Build tool data summary for Claude prompt
   */
  private buildToolDataSummary(context: AnalysisContext): string {
    let summary = `## Website: ${context.website.url}\n\n`;

    // Website content data
    if (context.website.content) {
      summary += `### Content Analysis\n`;
      summary += `- Title: ${context.website.title || 'Not found'}\n`;
      summary += `- Description: ${context.website.description || 'Not found'}\n`;
      summary += `- Content length: ${context.website.content.length} characters\n`;
      
      if (context.website.headings) {
        summary += `- Headings structure:\n`;
        Object.entries(context.website.headings).forEach(([tag, headings]) => {
          summary += `  - ${tag}: ${headings.length} found\n`;
        });
      }

      if (context.website.links) {
        summary += `- Links: ${context.website.links.internal?.length || 0} internal, ${context.website.links.external?.length || 0} external\n`;
      }

      if (context.website.images) {
        summary += `- Images: ${context.website.images.length} found\n`;
      }
    }

    // UX analysis data
    if (context.ux) {
      summary += `\n### UX Analysis\n`;
      summary += `- Visual analysis: Screenshot captured\n`;
      
      if (context.ux.accessibility) {
        summary += `- Accessibility: Analysis performed\n`;
      }
      
      if (context.ux.performance) {
        summary += `- Performance: Metrics collected\n`;
      }
    }

    // SEO technical data
    if (context.seo) {
      summary += `\n### Technical SEO Analysis\n`;
      summary += `- SEO score: ${context.seo.score || 'Not calculated'}\n`;
      summary += `- Issues found: ${context.seo.issues?.length || 0}\n`;
      summary += `- Recommendations: ${context.seo.recommendations?.length || 0}\n`;
    }

    return summary;
  }

  /**
   * Extract recommendations from Claude's response
   */
  private extractRecommendations(analysis: string): string[] {
    const lines = analysis.split('\n');
    const recommendations: string[] = [];
    
    let inRecommendationsSection = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('recommendation') || line.toLowerCase().includes('action')) {
        inRecommendationsSection = true;
        continue;
      }
      
      if (inRecommendationsSection && line.trim().startsWith('-')) {
        recommendations.push(line.trim().substring(1).trim());
      } else if (inRecommendationsSection && line.trim() === '') {
        // Continue in section
      } else if (inRecommendationsSection && line.trim().startsWith('#')) {
        // New section, stop
        break;
      }
    }
    
    // Fallback: extract numbered items
    if (recommendations.length === 0) {
      const numberedPattern = /^\d+\.\s*(.+)$/gm;
      let match;
      while ((match = numberedPattern.exec(analysis)) !== null) {
        recommendations.push(match[1].trim());
      }
    }
    
    return recommendations;
  }

  /**
   * Extract score from Claude's response
   */
  private extractScore(analysis: string): number | undefined {
    const scorePatterns = [
      /score[:\s]+(\d+)/i,
      /rating[:\s]+(\d+)/i,
      /(\d+)\/100/,
      /(\d+)%/,
    ];
    
    for (const pattern of scorePatterns) {
      const match = analysis.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    
    return undefined;
  }

  /**
   * Extract issues from analysis and context
   */
  private extractIssues(analysis: string, context: AnalysisContext): any[] {
    const issues: any[] = [];
    
    // Add tool-detected issues
    if (context.seo?.issues) {
      issues.push(...context.seo.issues);
    }
    
    // Extract issues from Claude's analysis
    const lines = analysis.split('\n');
    let inIssuesSection = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('issue') || line.toLowerCase().includes('problem')) {
        inIssuesSection = true;
        continue;
      }
      
      if (inIssuesSection && line.trim().startsWith('-')) {
        issues.push({
          type: 'analysis',
          description: line.trim().substring(1).trim(),
          source: 'claude',
        });
      } else if (inIssuesSection && line.trim().startsWith('#')) {
        break;
      }
    }
    
    return issues;
  }

  /**
   * Fallback analysis when tools fail
   */
  private async performFallbackAnalysis(
    context: AnalysisContext,
    prompt: string,
    error: Error
  ): Promise<Omit<AnalysisResult, 'context' | 'toolsUsed' | 'processingTime'>> {
    
    const fallbackPrompt = `
${prompt}

## Fallback Analysis Mode

Due to technical issues with analysis tools (${error.message}), please provide a comprehensive website analysis based on best practices and common SEO/UX patterns for: ${context.website.url}

Available data:
${context.website.content ? `- Content extracted: ${context.website.content.substring(0, 500)}...` : '- No content data available'}
${context.website.title ? `- Title: ${context.website.title}` : ''}
${context.website.description ? `- Description: ${context.website.description}` : ''}

Please provide actionable recommendations that would typically apply to websites, focusing on the tier level: ${context.tier}
`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        temperature: 0.8,
        messages: [
          {
            role: 'user',
            content: fallbackPrompt,
          },
        ],
      });

      const analysisText = response.content[0]?.type === 'text' 
        ? `⚠️ FALLBACK ANALYSIS (Tools temporarily unavailable)\n\n${response.content[0].text}` 
        : 'Fallback analysis unavailable';

      return {
        analysis: analysisText,
        recommendations: this.extractRecommendations(analysisText),
        score: this.extractScore(analysisText),
        issues: [
          {
            type: 'system',
            description: `Analysis tools unavailable: ${error.message}`,
            source: 'fallback',
          },
        ],
      };

    } catch (claudeError) {
      console.error('[ClaudeMcpWrapper] Fallback analysis failed:', claudeError);
      
      // Ultimate fallback
      return {
        analysis: `⚠️ SYSTEM ERROR: Unable to complete analysis due to technical issues.\n\nPrimary error: ${error.message}\nSecondary error: ${claudeError}\n\nPlease try again later or contact support.`,
        recommendations: [
          'Retry analysis after technical issues are resolved',
          'Contact support if problem persists',
        ],
        score: undefined,
        issues: [
          {
            type: 'system',
            description: 'Complete analysis failure',
            source: 'fallback',
          },
        ],
      };
    }
  }

  /**
   * Get health status of all MCP servers
   */
  getHealthStatus(): any {
    if (!this.initialized || !this.serverManager) {
      return { status: 'not_initialized' };
    }
    
    return {
      status: 'initialized',
      servers: this.serverManager.getHealthReport(),
      clients: {
        firecrawl: !!this.firecrawlClient,
        playwright: !!this.playwrightClient,
        dataforseo: !!this.dataForSeoClient,
      },
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[ClaudeMcpWrapper] Shutting down...');
    
    if (this.serverManager) {
      await this.serverManager.stopAll();
    }
    
    this.initialized = false;
    console.log('[ClaudeMcpWrapper] Shutdown complete');
  }
}