/**
 * Report Compilation Node for LangGraph Report Generation
 * 
 * This node aggregates all analysis results into the final report format.
 * It handles missing data gracefully and formats according to tier requirements.
 */

import { ReportState, TIER_CONFIG } from '../types';
import { getLiteAnalysisPrompts } from '../../prompts/lite-analysis';
import { getProAnalysisPrompts } from '../../prompts/pro-analysis';
import { getEliteAnalysisPrompts } from '../../prompts/elite-analysis';
import { getTasklistAnalysisPrompts } from '../../prompts/tasklist-analysis';
import Anthropic from '@anthropic-ai/sdk';

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('❌ ANTHROPIC_API_KEY not found in environment variables');
    }
    
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  
  return anthropicClient;
}

/**
 * AI query wrapper for report compilation
 */
async function aiQuery(prompt: string, options?: { timeout?: number }): Promise<any> {
  const client = getAnthropicClient();
  
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `${prompt}\n\nPlease provide a structured report in JSON format that can be used for PDF generation.`
      }
    ],
    temperature: 0.6,
  });

  const content = response.content[0];
  if (content.type === 'text') {
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        executive_summary: content.text.substring(0, 500) + '...',
        key_findings: 'Analysis completed with available data',
        recommendations: [],
        status: 'compiled'
      };
    } catch (parseError) {
      return {
        executive_summary: content.text.substring(0, 500) + '...',
        key_findings: 'Report generation completed',
        recommendations: [],
        status: 'partial'
      };
    }
  }
  
  throw new Error('Unexpected response format from Anthropic API');
}

/**
 * Update progress helper
 */
async function updateProgress(
  reportId: string,
  progress: number,
  message: string,
  tier?: string
): Promise<void> {
  console.log(`[${reportId}] Progress ${progress}%: ${message}`);
  // TODO: Implement database progress update when integrated with worker
}

/**
 * Generate Tasklist for Tasklist Pro tier
 */
async function generateTasklist(state: ReportState): Promise<any[]> {
  const { tier, technicalAnalysis, contentAnalysis, strategicAnalysis, competitiveAnalysis } = state;
  
  if (tier !== 'tasklist-pro') {
    return [];
  }
  
  try {
    const tasklistPrompt = `
      Generate a prioritized actionable task list based on the following analysis:
      
      Technical Analysis: ${JSON.stringify(technicalAnalysis?.recommendations || [], null, 2)}
      Content Analysis: ${JSON.stringify(contentAnalysis?.recommendations || [], null, 2)}
      Strategic Analysis: ${JSON.stringify(strategicAnalysis?.recommendations || [], null, 2)}
      Competitive Analysis: ${JSON.stringify(competitiveAnalysis?.recommendations || [], null, 2)}
      
      Create 20+ specific, actionable tasks with:
      1. Task title and description
      2. Priority level (Critical/High/Medium/Low)
      3. Estimated effort (Low/Medium/High)
      4. Timeframe for completion
      5. Expected impact/ROI
      6. Required resources
      7. Dependencies
      8. Success metrics
      
      Format for export to Asana/Notion/CSV.
    `;
    
    const result = await aiQuery(tasklistPrompt, { timeout: 90000 });
    
    return result.tasks || result.tasklist || [
      {
        id: 1,
        title: 'Optimize Page Titles',
        description: 'Review and optimize all page titles for better search visibility',
        priority: 'High',
        effort: 'Medium',
        timeframe: '1-2 weeks',
        impact: 'High - Improved CTR and rankings',
        resources: 'Content writer, SEO specialist',
        dependencies: 'Keyword research completion',
        metrics: 'CTR improvement, ranking positions'
      },
      {
        id: 2,
        title: 'Technical SEO Audit',
        description: 'Conduct comprehensive technical SEO audit and fixes',
        priority: 'Critical',
        effort: 'High',
        timeframe: '3-4 weeks',
        impact: 'Very High - Foundation for all SEO',
        resources: 'Technical SEO specialist, developer',
        dependencies: 'Access to website backend',
        metrics: 'Crawl errors, indexing improvements'
      }
    ];
  } catch (error) {
    console.error('Error generating tasklist:', error);
    return [];
  }
}

/**
 * Main Report Compilation Node
 * Aggregates all analysis results into final report format
 */
export async function compileReport(state: ReportState): Promise<Partial<ReportState>> {
  const { 
    domain, 
    reportId, 
    tier, 
    websiteContent, 
    seoMetrics, 
    screenshots, 
    competitorData,
    technicalAnalysis,
    contentAnalysis,
    strategicAnalysis,
    competitiveAnalysis,
    startTime
  } = state;
  
  try {
    await updateProgress(reportId, 96, 'Compiling final report...', tier);
    
    console.log(`[compileReport] Starting report compilation for ${domain} (${tier})`);
    
    // Get tier configuration
    const tierConfig = TIER_CONFIG[tier];
    
    // Generate tasklist for Tasklist Pro
    let tasklist: any[] = [];
    if (tier === 'tasklist-pro') {
      tasklist = await generateTasklist(state);
    }
    
    // Get tier-specific final report prompt
    let finalReportPrompt: string;
    switch (tier) {
      case 'lite':
        finalReportPrompt = getLiteAnalysisPrompts().finalReport;
        break;
      case 'pro':
        finalReportPrompt = getProAnalysisPrompts().finalReport;
        break;
      case 'elite':
        finalReportPrompt = getEliteAnalysisPrompts().finalReport;
        break;
      case 'tasklist-pro':
        finalReportPrompt = getTasklistAnalysisPrompts().executiveAnalysis;
        break;
      default:
        finalReportPrompt = getLiteAnalysisPrompts().finalReport;
    }
    
    // Prepare compilation context
    const compilationContext = `
      Compile comprehensive ${tier.toUpperCase()} tier report for ${domain}:
      
      TIER CONFIGURATION:
      - Analysis Depth: ${tierConfig.analysisDepth}
      - Features: ${tierConfig.features.join(', ')}
      - Max Execution Time: ${tierConfig.maxExecutionTime / 1000}s
      
      DATA SOURCES:
      Website Content: ${websiteContent ? 'Available' : 'Limited'}
      SEO Metrics: ${seoMetrics ? 'Available' : 'Limited'}
      Screenshots: ${screenshots?.length || 0} captured
      Competitors: ${competitorData?.length || 0} analyzed
      Technical Analysis: ${technicalAnalysis ? 'Completed' : 'Not available'}
      Content Analysis: ${contentAnalysis ? 'Completed' : 'Not available'}
      Strategic Analysis: ${strategicAnalysis ? 'Completed' : 'Not available'}
      Competitive Analysis: ${competitiveAnalysis ? 'Completed' : 'Not available'}
      
      ANALYSIS RESULTS:
      Technical: ${JSON.stringify(technicalAnalysis, null, 2)}
      Content: ${JSON.stringify(contentAnalysis, null, 2)}
      Strategic: ${JSON.stringify(strategicAnalysis, null, 2)}
      Competitive: ${JSON.stringify(competitiveAnalysis, null, 2)}
      
      ${tier === 'tasklist-pro' ? `GENERATED TASKLIST: ${JSON.stringify(tasklist, null, 2)}` : ''}
      
      ${finalReportPrompt}
      
      Ensure the report:
      1. Matches the ${tier} tier expectations and pricing
      2. Handles missing data gracefully
      3. Provides actionable, specific recommendations
      4. Is formatted for PDF generation
      5. Includes appropriate depth for the tier level
      6. Contains executive summary appropriate for the tier
      7. Has implementation roadmap (if applicable for tier)
    `;

    const result = await aiQuery(compilationContext, { timeout: 120000 });
    
    // Compile all recommendations from different analyses
    const allRecommendations = [
      ...(technicalAnalysis?.recommendations || []),
      ...(contentAnalysis?.recommendations || []),
      ...(strategicAnalysis?.recommendations || []),
      ...(competitiveAnalysis?.recommendations || [])
    ].sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Calculate overall scores
    const scores = [
      technicalAnalysis?.score,
      contentAnalysis?.score,
      strategicAnalysis?.score,
      competitiveAnalysis?.score
    ].filter(score => score !== undefined) as number[];
    
    const overallScore = scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 75;
    
    // Compile final report
    const finalReport = {
      metadata: {
        domain,
        tier,
        reportId,
        generatedAt: new Date().toISOString(),
        processingTime: startTime ? Date.now() - startTime : undefined,
        analysisDepth: tierConfig.analysisDepth,
        featuresIncluded: tierConfig.features,
        overallScore,
        dataCompleteness: {
          websiteContent: !!websiteContent,
          seoMetrics: !!seoMetrics,
          screenshots: (screenshots?.length || 0) > 0,
          competitors: (competitorData?.length || 0) > 0,
          technicalAnalysis: !!technicalAnalysis,
          contentAnalysis: !!contentAnalysis,
          strategicAnalysis: !!strategicAnalysis,
          competitiveAnalysis: !!competitiveAnalysis
        }
      },
      
      executiveSummary: result.executive_summary || 
        `${tier.charAt(0).toUpperCase() + tier.slice(1)} analysis completed for ${domain}. ` +
        `Overall performance score: ${overallScore}/100. ` +
        `${allRecommendations.length} recommendations identified across ` +
        `${scores.length} analysis areas.`,
      
      keyFindings: result.key_findings || {
        technical: technicalAnalysis?.findings || {},
        content: contentAnalysis?.findings || {},
        strategic: strategicAnalysis?.findings || {},
        competitive: competitiveAnalysis?.findings || {},
        overall_assessment: `Analysis completed with ${scores.length} completed modules`
      },
      
      recommendations: result.recommendations || allRecommendations,
      
      implementationRoadmap: result.implementation_roadmap || 
        (['elite', 'tasklist-pro'].includes(tier) ? {
          phase1: '1-2 weeks: Critical technical fixes and quick wins',
          phase2: '3-4 weeks: Content optimization and SEO improvements',  
          phase3: '2-3 months: Strategic initiatives and competitive positioning',
          phase4: '3-6 months: Advanced optimization and growth strategies'
        } : undefined),
      
      roiEstimates: result.roi_estimates || 
        (['elite', 'tasklist-pro'].includes(tier) ? {
          expectedTrafficIncrease: '25-50% in 6 months',
          conversionOptimization: '10-20% improvement potential',
          timeToSeeResults: '2-3 months for initial improvements',
          investmentRequired: 'Variable based on implementation scope'
        } : undefined),
      
      ...(tier === 'tasklist-pro' ? { tasklist } : {}),
      
      analysisDetails: {
        websiteContent: websiteContent ? {
          title: websiteContent.title,
          url: websiteContent.url,
          contentQuality: websiteContent.metadata?.content_quality,
          structureScore: websiteContent.metadata?.structure_score,
          accessibilityScore: websiteContent.metadata?.accessibility_score,
          error: websiteContent.error
        } : null,
        
        seoMetrics: seoMetrics ? {
          domain: seoMetrics.domain,
          metrics: seoMetrics.metrics,
          keywordsCount: seoMetrics.keywords?.length || 0,
          technicalIssues: seoMetrics.technicalIssues?.length || 0,
          error: seoMetrics.error
        } : null,
        
        screenshots: screenshots?.map(s => ({
          type: s.type,
          viewport: s.viewport,
          captured: !s.error,
          error: s.error
        })) || [],
        
        competitors: competitorData?.map(c => ({
          domain: c.domain,
          analyzed: !c.error,
          strengths: c.analysis?.strengths?.length || 0,
          weaknesses: c.analysis?.weaknesses?.length || 0,
          error: c.error
        })) || []
      },
      
      rawAnalysisData: result.raw_data || {
        technical: technicalAnalysis,
        content: contentAnalysis,
        strategic: strategicAnalysis,
        competitive: competitiveAnalysis
      }
    };

    console.log(`[compileReport] Report compilation completed for ${domain} (${tier})`);
    
    return {
      finalReport,
      progress: 100,
      progressMessage: 'Report compilation completed successfully',
      endTime: Date.now()
    };
    
  } catch (error) {
    console.error(`[compileReport] Error compiling report for ${domain}:`, error);
    
    // Generate fallback report
    const fallbackReport = {
      metadata: {
        domain,
        tier,
        reportId,
        generatedAt: new Date().toISOString(),
        processingTime: startTime ? Date.now() - startTime : undefined,
        analysisDepth: TIER_CONFIG[tier].analysisDepth,
        error: error instanceof Error ? error.message : 'Report compilation failed'
      },
      
      executiveSummary: `Report compilation encountered issues for ${domain}. ` +
        'Some analysis may be incomplete. Manual review and additional ' +
        'analysis may be required for comprehensive insights.',
      
      keyFindings: {
        compilation_error: true,
        partial_data_available: true,
        manual_review_recommended: true
      },
      
      recommendations: [
        {
          priority: 'high' as const,
          title: 'Manual Report Review',
          description: 'Conduct manual review of available data and complete missing analysis',
          impact: 'Ensures comprehensive website optimization insights',
          effort: 'high' as const,
          timeframe: '1-2 weeks'
        }
      ],
      
      error: error instanceof Error ? error.message : 'Compilation failed'
    };

    return {
      finalReport: fallbackReport,
      progress: 100,
      progressMessage: 'Report completed with limitations',
      endTime: Date.now(),
      errors: [
        ...state.errors,
        {
          node: 'compileReport',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
          retryCount: state.retries?.compileReport || 0
        }
      ]
    };
  }
}