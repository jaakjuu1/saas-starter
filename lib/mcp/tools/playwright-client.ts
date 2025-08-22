/**
 * Playwright MCP Client
 * Specialized client for browser automation and visual analysis
 */

import { McpClient } from '../mcp-client';

/**
 * Playwright navigation options
 */
export interface PlaywrightNavigateOptions {
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  timeout?: number;
}

/**
 * Playwright screenshot options
 */
export interface PlaywrightScreenshotOptions {
  fullPage?: boolean;
  type?: 'png' | 'jpeg';
  quality?: number; // For jpeg
  element?: string; // CSS selector or element reference
}

/**
 * Playwright click options
 */
export interface PlaywrightClickOptions {
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  delay?: number;
  position?: { x: number; y: number };
}

/**
 * Playwright type options
 */
export interface PlaywrightTypeOptions {
  delay?: number; // Delay between keystrokes
  submit?: boolean; // Press Enter after typing
}

/**
 * Playwright select options
 */
export interface PlaywrightSelectOptions {
  value?: string;
  label?: string;
  index?: number;
}

/**
 * Playwright Client
 */
export class PlaywrightClient {
  constructor(private mcpClient: McpClient) {}

  /**
   * Navigate to a URL
   */
  async navigate(url: string, options?: PlaywrightNavigateOptions): Promise<void> {
    console.log(`[PlaywrightClient] Navigating to ${url}`);
    
    const args = {
      url,
      ...options,
    };
    
    try {
      await this.mcpClient.callTool('browser_navigate', args);
    } catch (error) {
      console.error(`[PlaywrightClient] Navigation failed:`, error);
      throw error;
    }
  }

  /**
   * Go back to previous page
   */
  async goBack(): Promise<void> {
    console.log('[PlaywrightClient] Going back');
    
    try {
      await this.mcpClient.callTool('browser_navigate_back', {});
    } catch (error) {
      console.error('[PlaywrightClient] Go back failed:', error);
      throw error;
    }
  }

  /**
   * Go forward to next page
   */
  async goForward(): Promise<void> {
    console.log('[PlaywrightClient] Going forward');
    
    try {
      await this.mcpClient.callTool('browser_navigate_forward', {});
    } catch (error) {
      console.error('[PlaywrightClient] Go forward failed:', error);
      throw error;
    }
  }

  /**
   * Take a screenshot
   */
  async screenshot(options?: PlaywrightScreenshotOptions): Promise<string> {
    console.log('[PlaywrightClient] Taking screenshot');
    
    try {
      const result = await this.mcpClient.callTool('browser_take_screenshot', options || {});
      return this.processResult(result);
    } catch (error) {
      console.error('[PlaywrightClient] Screenshot failed:', error);
      throw error;
    }
  }

  /**
   * Get accessibility snapshot
   */
  async snapshot(): Promise<any> {
    console.log('[PlaywrightClient] Getting accessibility snapshot');
    
    try {
      const result = await this.mcpClient.callTool('browser_snapshot', {});
      return this.processResult(result);
    } catch (error) {
      console.error('[PlaywrightClient] Snapshot failed:', error);
      throw error;
    }
  }

  /**
   * Click an element
   */
  async click(selector: string, options?: PlaywrightClickOptions): Promise<void> {
    console.log(`[PlaywrightClient] Clicking ${selector}`);
    
    const args = {
      element: selector,
      ref: selector, // MCP might use ref instead
      ...options,
    };
    
    try {
      await this.mcpClient.callTool('browser_click', args);
    } catch (error) {
      console.error(`[PlaywrightClient] Click failed:`, error);
      throw error;
    }
  }

  /**
   * Type text into an element
   */
  async type(selector: string, text: string, options?: PlaywrightTypeOptions): Promise<void> {
    console.log(`[PlaywrightClient] Typing into ${selector}`);
    
    const args = {
      element: selector,
      ref: selector,
      text,
      ...options,
    };
    
    try {
      await this.mcpClient.callTool('browser_type', args);
    } catch (error) {
      console.error(`[PlaywrightClient] Type failed:`, error);
      throw error;
    }
  }

  /**
   * Select an option in a dropdown
   */
  async select(selector: string, options: PlaywrightSelectOptions): Promise<void> {
    console.log(`[PlaywrightClient] Selecting in ${selector}`);
    
    const values = [];
    if (options.value) values.push(options.value);
    if (options.label) values.push(options.label);
    
    const args = {
      element: selector,
      ref: selector,
      values,
    };
    
    try {
      await this.mcpClient.callTool('browser_select_option', args);
    } catch (error) {
      console.error(`[PlaywrightClient] Select failed:`, error);
      throw error;
    }
  }

  /**
   * Hover over an element
   */
  async hover(selector: string): Promise<void> {
    console.log(`[PlaywrightClient] Hovering over ${selector}`);
    
    const args = {
      element: selector,
      ref: selector,
    };
    
    try {
      await this.mcpClient.callTool('browser_hover', args);
    } catch (error) {
      console.error(`[PlaywrightClient] Hover failed:`, error);
      throw error;
    }
  }

  /**
   * Wait for a condition
   */
  async waitFor(options: { text?: string; selector?: string; timeout?: number }): Promise<void> {
    console.log('[PlaywrightClient] Waiting for condition');
    
    try {
      await this.mcpClient.callTool('browser_wait_for', options);
    } catch (error) {
      console.error('[PlaywrightClient] Wait failed:', error);
      throw error;
    }
  }

  /**
   * Get network requests
   */
  async getNetworkRequests(): Promise<any[]> {
    console.log('[PlaywrightClient] Getting network requests');
    
    try {
      const result = await this.mcpClient.callTool('browser_network_requests', {});
      return this.processResult(result);
    } catch (error) {
      console.error('[PlaywrightClient] Get network requests failed:', error);
      throw error;
    }
  }

  /**
   * Get console messages
   */
  async getConsoleMessages(): Promise<any[]> {
    console.log('[PlaywrightClient] Getting console messages');
    
    try {
      const result = await this.mcpClient.callTool('browser_console_messages', {});
      return this.processResult(result);
    } catch (error) {
      console.error('[PlaywrightClient] Get console messages failed:', error);
      throw error;
    }
  }

  /**
   * Evaluate JavaScript on the page
   */
  async evaluate(script: string, element?: string): Promise<any> {
    console.log('[PlaywrightClient] Evaluating JavaScript');
    
    const args = {
      function: script,
      element,
      ref: element,
    };
    
    try {
      const result = await this.mcpClient.callTool('browser_evaluate', args);
      return this.processResult(result);
    } catch (error) {
      console.error('[PlaywrightClient] Evaluate failed:', error);
      throw error;
    }
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    console.log('[PlaywrightClient] Closing browser');
    
    try {
      await this.mcpClient.callTool('browser_close', {});
    } catch (error) {
      console.error('[PlaywrightClient] Close failed:', error);
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
   * Perform visual UX analysis
   */
  async analyzeUX(url: string): Promise<{
    screenshot?: string;
    accessibility?: any;
    performance?: any;
    console?: any[];
  }> {
    console.log(`[PlaywrightClient] Analyzing UX for ${url}`);
    
    const analysis: any = {};
    
    try {
      // Navigate to the page
      await this.navigate(url, { waitUntil: 'networkidle' });
      
      // Take a screenshot
      analysis.screenshot = await this.screenshot({ fullPage: false });
      
      // Get accessibility snapshot
      analysis.accessibility = await this.snapshot();
      
      // Get console messages for errors
      analysis.console = await this.getConsoleMessages();
      
      // Get performance metrics
      analysis.performance = await this.evaluate(`
        () => {
          const perf = window.performance.timing;
          return {
            loadTime: perf.loadEventEnd - perf.navigationStart,
            domContentLoaded: perf.domContentLoadedEventEnd - perf.navigationStart,
            firstPaint: perf.responseStart - perf.navigationStart,
          };
        }
      `);
      
      return analysis;
    } catch (error) {
      console.error('[PlaywrightClient] UX analysis failed:', error);
      throw error;
    }
  }

  /**
   * Check mobile responsiveness
   */
  async checkMobileResponsiveness(url: string): Promise<{
    desktop?: string;
    mobile?: string;
    tablet?: string;
  }> {
    console.log(`[PlaywrightClient] Checking mobile responsiveness for ${url}`);
    
    const screenshots: any = {};
    
    try {
      // Desktop view
      await this.navigate(url);
      screenshots.desktop = await this.screenshot();
      
      // Mobile view (resize window)
      await this.mcpClient.callTool('browser_resize', { width: 375, height: 812 });
      screenshots.mobile = await this.screenshot();
      
      // Tablet view
      await this.mcpClient.callTool('browser_resize', { width: 768, height: 1024 });
      screenshots.tablet = await this.screenshot();
      
      return screenshots;
    } catch (error) {
      console.error('[PlaywrightClient] Responsiveness check failed:', error);
      throw error;
    }
  }
}