/**
 * DataForSEO MCP Client
 * Specialized client for SEO data and analytics
 */

import { McpClient } from '../mcp-client';

/**
 * DataForSEO SERP options
 */
export interface DataForSeoSerpOptions {
  keyword: string;
  location?: string;
  language?: string;
  device?: 'desktop' | 'mobile';
  depth?: number;
}

/**
 * DataForSEO Keywords options
 */
export interface DataForSeoKeywordsOptions {
  keywords: string[];
  location?: string;
  language?: string;
  includeVolume?: boolean;
  includeCPC?: boolean;
  includeDifficulty?: boolean;
}

/**
 * DataForSEO Backlinks options
 */
export interface DataForSeoBacklinksOptions {
  target: string;
  mode?: 'domain' | 'page';
  limit?: number;
  filters?: any;
}

/**
 * DataForSEO Domain Analytics options
 */
export interface DataForSeoDomainOptions {
  domain: string;
  includeSubdomains?: boolean;
  metrics?: string[];
}

/**
 * DataForSEO On-Page options
 */
export interface DataForSeoOnPageOptions {
  url: string;
  loadResources?: boolean;
  checkSpelling?: boolean;
  enableJavascript?: boolean;
}

/**
 * DataForSEO Client
 */
export class DataForSeoClient {
  constructor(private mcpClient: McpClient) {}

  /**
   * Get SERP results
   */
  async getSerpResults(options: DataForSeoSerpOptions): Promise<any> {
    console.log(`[DataForSeoClient] Getting SERP results for: ${options.keyword}`);
    
    try {
      const result = await this.mcpClient.callTool('dataforseo_serp', options);
      return this.processResult(result);
    } catch (error) {
      console.error('[DataForSeoClient] SERP request failed:', error);
      throw error;
    }
  }

  /**
   * Get keyword data
   */
  async getKeywordData(options: DataForSeoKeywordsOptions): Promise<any> {
    console.log(`[DataForSeoClient] Getting keyword data for ${options.keywords.length} keywords`);
    
    try {
      const result = await this.mcpClient.callTool('dataforseo_keywords', options);
      return this.processResult(result);
    } catch (error) {
      console.error('[DataForSeoClient] Keywords request failed:', error);
      throw error;
    }
  }

  /**
   * Get backlinks data
   */
  async getBacklinks(options: DataForSeoBacklinksOptions): Promise<any> {
    console.log(`[DataForSeoClient] Getting backlinks for: ${options.target}`);
    
    try {
      const result = await this.mcpClient.callTool('dataforseo_backlinks', options);
      return this.processResult(result);
    } catch (error) {
      console.error('[DataForSeoClient] Backlinks request failed:', error);
      throw error;
    }
  }

  /**
   * Get domain analytics
   */
  async getDomainAnalytics(options: DataForSeoDomainOptions): Promise<any> {
    console.log(`[DataForSeoClient] Getting domain analytics for: ${options.domain}`);
    
    try {
      const result = await this.mcpClient.callTool('dataforseo_domain_analytics', options);
      return this.processResult(result);
    } catch (error) {
      console.error('[DataForSeoClient] Domain analytics failed:', error);
      throw error;
    }
  }

  /**
   * Get on-page SEO analysis
   */
  async getOnPageAnalysis(options: DataForSeoOnPageOptions): Promise<any> {
    console.log(`[DataForSeoClient] Getting on-page analysis for: ${options.url}`);
    
    try {
      const result = await this.mcpClient.callTool('dataforseo_onpage', options);
      return this.processResult(result);
    } catch (error) {
      console.error('[DataForSeoClient] On-page analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get competitor analysis
   */
  async getCompetitorAnalysis(domain: string): Promise<{
    competitors?: any[];
    keywords?: any[];
    gaps?: any[];
  }> {
    console.log(`[DataForSeoClient] Getting competitor analysis for: ${domain}`);
    
    try {
      // Get domain competitors
      const competitors = await this.mcpClient.callTool('dataforseo_competitors', {
        domain,
        limit: 10,
      });
      
      // Get keyword gaps
      const keywordGaps = await this.mcpClient.callTool('dataforseo_keyword_gaps', {
        domain,
        competitors: competitors.slice(0, 3),
      });
      
      return {
        competitors: this.processResult(competitors),
        keywords: this.processResult(keywordGaps),
        gaps: this.identifyGaps(domain, competitors, keywordGaps),
      };
    } catch (error) {
      console.error('[DataForSeoClient] Competitor analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get technical SEO audit
   */
  async getTechnicalAudit(url: string): Promise<{
    issues?: any[];
    score?: number;
    recommendations?: string[];
  }> {
    console.log(`[DataForSeoClient] Getting technical audit for: ${url}`);
    
    try {
      const onPage = await this.getOnPageAnalysis({
        url,
        loadResources: true,
        checkSpelling: true,
        enableJavascript: true,
      });
      
      return this.processTechnicalAudit(onPage);
    } catch (error) {
      console.error('[DataForSeoClient] Technical audit failed:', error);
      throw error;
    }
  }

  /**
   * Get keyword research data
   */
  async getKeywordResearch(seedKeyword: string, location?: string): Promise<{
    keywords?: any[];
    suggestions?: any[];
    questions?: any[];
  }> {
    console.log(`[DataForSeoClient] Getting keyword research for: ${seedKeyword}`);
    
    try {
      // Get keyword suggestions
      const suggestions = await this.mcpClient.callTool('dataforseo_keyword_suggestions', {
        keyword: seedKeyword,
        location,
        limit: 50,
      });
      
      // Get related questions
      const questions = await this.mcpClient.callTool('dataforseo_related_questions', {
        keyword: seedKeyword,
        location,
      });
      
      // Get keyword data for suggestions
      const keywordData = await this.getKeywordData({
        keywords: suggestions.slice(0, 20),
        location,
        includeVolume: true,
        includeCPC: true,
        includeDifficulty: true,
      });
      
      return {
        keywords: this.processResult(keywordData),
        suggestions: this.processResult(suggestions),
        questions: this.processResult(questions),
      };
    } catch (error) {
      console.error('[DataForSeoClient] Keyword research failed:', error);
      throw error;
    }
  }

  /**
   * Process and validate result
   */
  private processResult(result: any): any {
    // Handle different response formats from MCP
    if (Array.isArray(result)) {
      if (result.length > 0 && result[0].type === 'text') {
        try {
          return JSON.parse(result[0].text);
        } catch {
          return result[0].text;
        }
      }
      return result;
    }
    
    return result;
  }

  /**
   * Process technical audit results
   */
  private processTechnicalAudit(data: any): any {
    const audit: any = {
      issues: [],
      score: 100,
      recommendations: [],
    };
    
    // Extract issues
    if (data.errors) {
      audit.issues = data.errors;
      audit.score -= data.errors.length * 5;
    }
    
    if (data.warnings) {
      audit.issues.push(...data.warnings);
      audit.score -= data.warnings.length * 2;
    }
    
    // Generate recommendations
    if (audit.issues.length > 0) {
      audit.recommendations = this.generateRecommendations(audit.issues);
    }
    
    // Ensure score doesn't go below 0
    audit.score = Math.max(0, audit.score);
    
    return audit;
  }

  /**
   * Generate recommendations from issues
   */
  private generateRecommendations(issues: any[]): string[] {
    const recommendations = new Set<string>();
    
    for (const issue of issues) {
      if (issue.type === 'meta' || issue.description?.includes('meta')) {
        recommendations.add('Optimize meta tags and descriptions');
      }
      if (issue.type === 'heading' || issue.description?.includes('h1')) {
        recommendations.add('Fix heading hierarchy and structure');
      }
      if (issue.type === 'image' || issue.description?.includes('alt')) {
        recommendations.add('Add alt text to all images');
      }
      if (issue.type === 'performance' || issue.description?.includes('speed')) {
        recommendations.add('Improve page loading speed');
      }
      if (issue.type === 'mobile' || issue.description?.includes('responsive')) {
        recommendations.add('Enhance mobile responsiveness');
      }
    }
    
    return Array.from(recommendations);
  }

  /**
   * Identify keyword gaps
   */
  private identifyGaps(domain: string, competitors: any[], keywords: any[]): any[] {
    // Simple gap identification logic
    const gaps = [];
    
    // This would normally involve more complex analysis
    if (keywords && Array.isArray(keywords)) {
      for (const keyword of keywords) {
        if (keyword.competitors_count > keyword.domain_rank) {
          gaps.push({
            keyword: keyword.keyword,
            opportunity: 'high',
            difficulty: keyword.difficulty,
            volume: keyword.volume,
          });
        }
      }
    }
    
    return gaps;
  }
}