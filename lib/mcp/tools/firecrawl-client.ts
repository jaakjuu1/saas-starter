/**
 * Firecrawl MCP Client
 * Specialized client for Firecrawl web scraping operations
 */

import { McpClient } from '../mcp-client';

/**
 * Firecrawl scrape options
 */
export interface FirecrawlScrapeOptions {
  formats?: ('markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot' | 'screenshot@fullPage')[];
  includeTags?: string[];
  excludeTags?: string[];
  onlyMainContent?: boolean;
  waitFor?: number;
  timeout?: number;
}

/**
 * Firecrawl batch scrape options
 */
export interface FirecrawlBatchScrapeOptions extends FirecrawlScrapeOptions {
  urls: string[];
}

/**
 * Firecrawl map options
 */
export interface FirecrawlMapOptions {
  search?: string;
  ignoreSitemap?: boolean;
  includeSubdomains?: boolean;
  limit?: number;
}

/**
 * Firecrawl search options
 */
export interface FirecrawlSearchOptions {
  limit?: number;
  lang?: string;
  country?: string;
  location?: string;
  tbs?: string;
}

/**
 * Firecrawl extract options
 */
export interface FirecrawlExtractOptions {
  schema?: Record<string, any>;
  systemPrompt?: string;
  prompt?: string;
}

/**
 * Firecrawl deep research options
 */
export interface FirecrawlDeepResearchOptions {
  topic: string;
  depth?: 'basic' | 'detailed' | 'comprehensive';
  maxSources?: number;
}

/**
 * Firecrawl Client
 */
export class FirecrawlClient {
  constructor(private mcpClient: McpClient) {}

  /**
   * Scrape a single URL
   */
  async scrape(url: string, options?: FirecrawlScrapeOptions): Promise<any> {
    console.log(`[FirecrawlClient] Scraping ${url}`);
    
    const args = {
      url,
      ...options,
    };
    
    try {
      const result = await this.mcpClient.callTool('firecrawl_scrape', args);
      return this.processResult(result);
    } catch (error) {
      console.error(`[FirecrawlClient] Scrape failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Batch scrape multiple URLs
   */
  async batchScrape(options: FirecrawlBatchScrapeOptions): Promise<any[]> {
    console.log(`[FirecrawlClient] Batch scraping ${options.urls.length} URLs`);
    
    try {
      const result = await this.mcpClient.callTool('firecrawl_batch_scrape', options);
      return this.processResult(result);
    } catch (error) {
      console.error('[FirecrawlClient] Batch scrape failed:', error);
      throw error;
    }
  }

  /**
   * Map a website (discover all URLs)
   */
  async map(url: string, options?: FirecrawlMapOptions): Promise<string[]> {
    console.log(`[FirecrawlClient] Mapping ${url}`);
    
    const args = {
      url,
      ...options,
    };
    
    try {
      const result = await this.mcpClient.callTool('firecrawl_map', args);
      return this.processResult(result);
    } catch (error) {
      console.error(`[FirecrawlClient] Map failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Search the web
   */
  async search(query: string, options?: FirecrawlSearchOptions): Promise<any> {
    console.log(`[FirecrawlClient] Searching for: ${query}`);
    
    const args = {
      query,
      ...options,
    };
    
    try {
      const result = await this.mcpClient.callTool('firecrawl_search', args);
      return this.processResult(result);
    } catch (error) {
      console.error(`[FirecrawlClient] Search failed for ${query}:`, error);
      throw error;
    }
  }

  /**
   * Extract structured data from a page
   */
  async extract(url: string, options?: FirecrawlExtractOptions): Promise<any> {
    console.log(`[FirecrawlClient] Extracting from ${url}`);
    
    const args = {
      url,
      ...options,
    };
    
    try {
      const result = await this.mcpClient.callTool('firecrawl_extract', args);
      return this.processResult(result);
    } catch (error) {
      console.error(`[FirecrawlClient] Extract failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Conduct deep research on a topic
   */
  async deepResearch(options: FirecrawlDeepResearchOptions): Promise<any> {
    console.log(`[FirecrawlClient] Deep research on: ${options.topic}`);
    
    try {
      const result = await this.mcpClient.callTool('firecrawl_deep_research', options);
      return this.processResult(result);
    } catch (error) {
      console.error(`[FirecrawlClient] Deep research failed:`, error);
      throw error;
    }
  }

  /**
   * Process and validate result
   */
  private processResult(result: any): any {
    // Handle different response formats from MCP
    if (Array.isArray(result)) {
      // Tool response is typically an array of content objects
      if (result.length > 0 && result[0].type === 'text') {
        try {
          // Try to parse as JSON
          return JSON.parse(result[0].text);
        } catch {
          // Return as text if not JSON
          return result[0].text;
        }
      }
      return result;
    }
    
    return result;
  }

  /**
   * Scrape website for SEO analysis
   */
  async scrapeForSEO(url: string): Promise<{
    title?: string;
    description?: string;
    headings?: Record<string, string[]>;
    links?: { internal: string[]; external: string[] };
    images?: { src: string; alt?: string }[];
    content?: string;
  }> {
    console.log(`[FirecrawlClient] SEO scrape for ${url}`);
    
    const result = await this.scrape(url, {
      formats: ['markdown', 'links'],
      onlyMainContent: true,
    });
    
    // Parse and structure for SEO analysis
    return this.parseSEOData(result);
  }

  /**
   * Parse SEO data from scrape result
   */
  private parseSEOData(data: any): any {
    const seoData: any = {
      content: data.markdown || data.content || '',
    };
    
    // Extract title
    const titleMatch = seoData.content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      seoData.title = titleMatch[1];
    }
    
    // Extract headings
    seoData.headings = {
      h1: [],
      h2: [],
      h3: [],
    };
    
    const h1Matches = seoData.content.matchAll(/^#\s+(.+)$/gm);
    for (const match of h1Matches) {
      seoData.headings.h1.push(match[1]);
    }
    
    const h2Matches = seoData.content.matchAll(/^##\s+(.+)$/gm);
    for (const match of h2Matches) {
      seoData.headings.h2.push(match[1]);
    }
    
    const h3Matches = seoData.content.matchAll(/^###\s+(.+)$/gm);
    for (const match of h3Matches) {
      seoData.headings.h3.push(match[1]);
    }
    
    // Process links if available
    if (data.links) {
      seoData.links = {
        internal: data.links.filter((link: string) => !link.startsWith('http')),
        external: data.links.filter((link: string) => link.startsWith('http')),
      };
    }
    
    return seoData;
  }
}