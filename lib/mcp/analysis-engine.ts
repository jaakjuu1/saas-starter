/**
 * Analysis Engine
 * Orchestrates tier-specific analysis using Claude MCP Wrapper
 * Replaces mock implementations with real tool-driven analysis
 */

import { ClaudeMcpWrapper, AnalysisResult, ProgressCallback } from './claude-mcp-wrapper';

// Import tier-specific prompts
import { LITE_WEBSITE_ANALYSIS_PROMPT } from '../prompts/lite-analysis';
import { PRO_COMPREHENSIVE_ANALYSIS_PROMPT } from '../prompts/pro-analysis';
import { ELITE_STRATEGIC_ANALYSIS_PROMPT } from '../prompts/elite-analysis';
import { TASKLIST_EXECUTIVE_ANALYSIS_PROMPT } from '../prompts/tasklist-analysis';

/**
 * Analysis request configuration
 */
export interface AnalysisRequest {
  domain: string;
  tier: 'lite' | 'pro' | 'elite' | 'tasklist_pro';
  reportId?: string;
}

/**
 * Enhanced analysis result with tier-specific formatting
 */
export interface EnhancedAnalysisResult extends AnalysisResult {
  tier: string;
  domain: string;
  reportId?: string;
  formattedReport: string;
  metadata: {
    analysisTime: number;
    toolsSuccessful: number;
    toolsFailed: number;
    fallbackUsed: boolean;
  };
}

/**
 * Analysis Engine - Orchestrates tier-specific website analysis
 */
export class AnalysisEngine {
  private claudeWrapper: ClaudeMcpWrapper | null = null;
  private anthropicApiKey: string;

  constructor(anthropicApiKey: string) {
    this.anthropicApiKey = anthropicApiKey;
  }

  /**
   * Perform tier-specific website analysis
   */
  async analyzeWebsite(
    request: AnalysisRequest,
    progressCallback?: ProgressCallback
  ): Promise<EnhancedAnalysisResult> {
    
    progressCallback?.('setup', 5, 'Initializing analysis engine...');
    
    // Initialize Claude wrapper for this tier
    this.claudeWrapper = new ClaudeMcpWrapper(this.anthropicApiKey);
    
    try {
      await this.claudeWrapper.initialize(request.tier);
      
      progressCallback?.('initialized', 10, `Analysis tools ready for ${request.tier} tier`);
      
      // Get tier-specific prompt
      const prompt = this.getTierPrompt(request.tier);
      
      // Perform analysis with real tools
      const startTime = Date.now();
      
      const analysisResult = await this.claudeWrapper.analyzeWebsite(
        request.domain,
        request.tier,
        prompt,
        progressCallback
      );
      
      const analysisTime = Date.now() - startTime;
      
      // Format result for tier
      const formattedReport = this.formatReportForTier(analysisResult, request.tier);
      
      // Calculate metadata
      const metadata = this.calculateMetadata(analysisResult, analysisTime);
      
      return {
        ...analysisResult,
        tier: request.tier,
        domain: request.domain,
        reportId: request.reportId,
        formattedReport,
        metadata,
      };

    } catch (error) {
      console.error('[AnalysisEngine] Analysis failed:', error);
      
      // Attempt graceful degradation
      progressCallback?.('error', 95, 'Analysis failed, attempting recovery...');
      
      const fallbackResult = await this.handleAnalysisFailure(request, error as Error);
      
      return fallbackResult;
      
    } finally {
      // Always cleanup
      try {
        await this.claudeWrapper.shutdown();
      } catch (shutdownError) {
        console.error('[AnalysisEngine] Shutdown error:', shutdownError);
      }
    }
  }

  /**
   * Get tier-specific analysis prompt
   */
  private getTierPrompt(tier: string): string {
    switch (tier) {
      case 'lite':
        return LITE_WEBSITE_ANALYSIS_PROMPT;
      case 'pro':
        return PRO_COMPREHENSIVE_ANALYSIS_PROMPT;
      case 'elite':
        return ELITE_STRATEGIC_ANALYSIS_PROMPT;
      case 'tasklist_pro':
        return TASKLIST_EXECUTIVE_ANALYSIS_PROMPT;
      default:
        console.warn(`[AnalysisEngine] Unknown tier: ${tier}, using lite`);
        return LITE_WEBSITE_ANALYSIS_PROMPT;
    }
  }

  /**
   * Format analysis result for specific tier
   */
  private formatReportForTier(result: AnalysisResult, tier: string): string {
    const { analysis, recommendations, score, context, toolsUsed } = result;
    
    let formatted = '';
    
    // Header with tier info
    formatted += `# ${this.getTierDisplayName(tier)} Website Analysis Report\n\n`;
    formatted += `**Website:** ${context.website.url}\n`;
    formatted += `**Analysis Date:** ${new Date().toLocaleDateString()}\n`;
    formatted += `**Tools Used:** ${toolsUsed.join(', ') || 'Basic analysis'}\n`;
    if (score) {
      formatted += `**Overall Score:** ${score}/100\n`;
    }
    formatted += `\n---\n\n`;
    
    // Main analysis
    formatted += analysis;
    
    // Recommendations section
    if (recommendations.length > 0) {
      formatted += `\n\n## Action Items\n\n`;
      recommendations.forEach((rec, index) => {
        formatted += `${index + 1}. ${rec}\n`;
      });
    }
    
    // Tier-specific additions
    switch (tier) {
      case 'lite':
        formatted += this.addLiteSpecificContent(result);
        break;
      case 'pro':
        formatted += this.addProSpecificContent(result);
        break;
      case 'elite':
        formatted += this.addEliteSpecificContent(result);
        break;
      case 'tasklist_pro':
        formatted += this.addTasklistSpecificContent(result);
        break;
    }
    
    // Technical details
    formatted += `\n\n## Technical Details\n\n`;
    formatted += `- **Processing Time:** ${Math.round(result.processingTime / 1000)}s\n`;
    formatted += `- **Data Sources:** ${toolsUsed.length} active tool${toolsUsed.length !== 1 ? 's' : ''}\n`;
    formatted += `- **Analysis Type:** Real-time data collection\n`;
    
    return formatted;
  }

  /**
   * Add lite tier specific content
   */
  private addLiteSpecificContent(result: AnalysisResult): string {
    let content = '\n\n## Quick Wins Focus\n\n';
    content += 'This lite analysis focuses on immediate, high-impact improvements you can implement today.\n\n';
    
    if (result.context.website.title) {
      content += `**Current Title:** ${result.context.website.title}\n`;
    }
    
    if (result.context.website.description) {
      content += `**Current Description:** ${result.context.website.description}\n`;
    }
    
    return content;
  }

  /**
   * Add pro tier specific content
   */
  private addProSpecificContent(result: AnalysisResult): string {
    let content = '\n\n## Pro Analysis Insights\n\n';
    
    if (result.context.ux) {
      content += '### Visual Analysis\n';
      content += 'Advanced UX analysis performed with browser automation tools.\n\n';
      
      if (result.context.ux.screenshot) {
        content += '- Visual screenshot captured for analysis\n';
      }
      if (result.context.ux.accessibility) {
        content += '- Accessibility audit completed\n';
      }
    }
    
    if (result.context.website.links) {
      content += '\n### Link Structure\n';
      content += `- Internal links: ${result.context.website.links.internal?.length || 0}\n`;
      content += `- External links: ${result.context.website.links.external?.length || 0}\n`;
    }
    
    return content;
  }

  /**
   * Add elite tier specific content
   */
  private addEliteSpecificContent(result: AnalysisResult): string {
    let content = '\n\n## Elite Strategic Analysis\n\n';
    
    if (result.context.seo) {
      content += '### Technical SEO Audit\n';
      content += `- Technical score: ${result.context.seo.score || 'N/A'}\n`;
      content += `- Issues identified: ${result.context.seo.issues?.length || 0}\n`;
      content += `- Recommendations: ${result.context.seo.recommendations?.length || 0}\n\n`;
    }
    
    content += '### Strategic Recommendations\n';
    content += 'Enterprise-level analysis with competitive insights and implementation roadmap.\n\n';
    
    return content;
  }

  /**
   * Add tasklist pro specific content
   */
  private addTasklistSpecificContent(result: AnalysisResult): string {
    let content = '\n\n## Tasklist Pro: Actionable Tasks\n\n';
    
    content += '### Implementation Priority Matrix\n\n';
    
    // Categorize recommendations by effort/impact
    if (result.recommendations.length > 0) {
      const quickWins = result.recommendations.slice(0, Math.ceil(result.recommendations.length / 3));
      const mediumTasks = result.recommendations.slice(quickWins.length, quickWins.length + Math.ceil(result.recommendations.length / 3));
      const longTerm = result.recommendations.slice(quickWins.length + mediumTasks.length);
      
      if (quickWins.length > 0) {
        content += '#### Quick Wins (1-2 weeks)\n';
        quickWins.forEach((task, index) => {
          content += `- [ ] ${task}\n`;
        });
        content += '\n';
      }
      
      if (mediumTasks.length > 0) {
        content += '#### Medium Impact (1-2 months)\n';
        mediumTasks.forEach((task, index) => {
          content += `- [ ] ${task}\n`;
        });
        content += '\n';
      }
      
      if (longTerm.length > 0) {
        content += '#### Strategic Projects (3-6 months)\n';
        longTerm.forEach((task, index) => {
          content += `- [ ] ${task}\n`;
        });
        content += '\n';
      }
    }
    
    content += '### Export Options\n';
    content += '- **Asana:** Import checklist to project management\n';
    content += '- **Notion:** Copy to your workspace\n';
    content += '- **CSV:** Download for spreadsheet analysis\n';
    
    return content;
  }

  /**
   * Calculate analysis metadata
   */
  private calculateMetadata(result: AnalysisResult, analysisTime: number): EnhancedAnalysisResult['metadata'] {
    const totalPossibleTools = 3; // firecrawl, playwright, dataforseo
    const toolsSuccessful = result.toolsUsed.length;
    const toolsFailed = totalPossibleTools - toolsSuccessful;
    const fallbackUsed = result.analysis.includes('FALLBACK') || result.analysis.includes('⚠️');
    
    return {
      analysisTime,
      toolsSuccessful,
      toolsFailed,
      fallbackUsed,
    };
  }

  /**
   * Get display name for tier
   */
  private getTierDisplayName(tier: string): string {
    switch (tier) {
      case 'lite': return 'Lite';
      case 'pro': return 'Pro';
      case 'elite': return 'Elite';
      case 'tasklist_pro': return 'Tasklist Pro';
      default: return 'Unknown';
    }
  }

  /**
   * Handle analysis failure with graceful degradation
   */
  private async handleAnalysisFailure(
    request: AnalysisRequest,
    error: Error
  ): Promise<EnhancedAnalysisResult> {
    
    console.error('[AnalysisEngine] Implementing fallback analysis:', error);
    
    // Create minimal fallback result
    const fallbackAnalysis: AnalysisResult = {
      analysis: `# Analysis Temporarily Unavailable\n\nWe encountered technical difficulties while analyzing ${request.domain}.\n\n**Error:** ${error.message}\n\n## General Recommendations\n\nWhile we resolve this issue, here are some universal best practices for website optimization:\n\n1. Ensure your website loads quickly (under 3 seconds)\n2. Make sure all pages have unique title tags and meta descriptions\n3. Verify mobile responsiveness across devices\n4. Check for broken links and 404 errors\n5. Optimize images with proper alt text\n6. Ensure clean URL structure\n7. Add structured data markup\n8. Implement proper heading hierarchy (H1, H2, H3)\n9. Improve internal linking structure\n10. Monitor Core Web Vitals scores\n\n## Next Steps\n\n- Try running the analysis again in a few minutes\n- Contact support if the issue persists\n- Consider upgrading your tier for enhanced analysis capabilities\n\nWe apologize for the inconvenience and are working to resolve this issue.`,
      recommendations: [
        'Retry analysis after technical issues are resolved',
        'Verify website accessibility during high traffic',
        'Contact support if problems persist',
        'Check website basic functionality manually',
        'Review general SEO best practices',
      ],
      score: undefined,
      issues: [
        {
          type: 'system',
          description: `Analysis engine failure: ${error.message}`,
          source: 'fallback',
        },
      ],
      context: {
        website: { url: request.domain },
        tier: request.tier,
      },
      toolsUsed: [],
      processingTime: 1000, // Minimal processing time
    };
    
    const formattedReport = this.formatReportForTier(fallbackAnalysis, request.tier);
    
    return {
      ...fallbackAnalysis,
      tier: request.tier,
      domain: request.domain,
      reportId: request.reportId,
      formattedReport,
      metadata: {
        analysisTime: 1000,
        toolsSuccessful: 0,
        toolsFailed: 3,
        fallbackUsed: true,
      },
    };
  }

  /**
   * Get health status of analysis engine
   */
  async getHealthStatus(): Promise<any> {
    if (!this.claudeWrapper) {
      return { status: 'not_initialized' };
    }
    
    return this.claudeWrapper.getHealthStatus();
  }
}