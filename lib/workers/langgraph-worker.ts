/**
 * LangGraph Worker Integration
 * 
 * This file integrates LangGraph report generation with the existing BullMQ worker system.
 * It handles streaming execution, real-time progress updates to database, error recovery 
 * with checkpointing, and final report extraction.
 */

import { Job } from 'bullmq';
import { db } from '@/lib/db/drizzle';
import { reports, reportJobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ReportJobData, ReportJobProgress } from '@/lib/queue/report-queue';
import { 
  executeReportGeneration, 
  streamReportGeneration, 
  initializeReportState 
} from '../langgraph/report-graph';
import { ReportState, ReportTier } from '../langgraph/types';

/**
 * Progress callback for real-time database updates
 */
async function createProgressCallback(
  job: Job<ReportJobData>
): Promise<(progress: number, message: string, stage: string) => Promise<void>> {
  return async (progress: number, message: string, stage: string) => {
    try {
      // Update job progress in BullMQ
      await job.updateProgress(progress);
      
      // Update database record
      await db
        .update(reportJobs)
        .set({
          progress,
          status: progress === 100 ? 'completed' : 'active',
          updatedAt: new Date(),
          progressMessage: message,
          currentStage: stage
        })
        .where(eq(reportJobs.reportId, job.data.reportId));

      console.log(`[LangGraph ${job.data.reportId}] ${progress}% - ${stage}: ${message}`);
    } catch (error) {
      console.error(`[LangGraph ${job.data.reportId}] Progress update failed:`, error);
      // Don't throw here - progress update failures shouldn't stop execution
    }
  };
}

/**
 * Update report status in database
 */
async function updateReportStatus(
  reportId: number, 
  status: string, 
  finalReport?: any, 
  error?: string
): Promise<void> {
  const updateData: any = {
    status,
    updatedAt: new Date(),
    ...(error && { error }),
    ...(finalReport && { reportData: JSON.stringify(finalReport) })
  };

  if (status === 'completed') {
    updateData.completedAt = new Date();
  }

  await db
    .update(reports)
    .set(updateData)
    .where(eq(reports.id, reportId));
}

/**
 * Process report using LangGraph with streaming execution
 * This is the main entry point for LangGraph-based report generation
 */
export async function processReportWithLangGraph(job: Job<ReportJobData>): Promise<any> {
  const { domain, reportTier, reportId } = job.data;
  const startTime = Date.now();
  
  console.log(`[LangGraph Worker] Starting report generation for ${domain} (${reportTier})`);
  
  // Validate tier
  const validTiers: ReportTier[] = ['lite', 'pro', 'elite', 'tasklist-pro'];
  if (!validTiers.includes(reportTier as ReportTier)) {
    throw new Error(`Invalid report tier: ${reportTier}`);
  }

  // Create progress callback
  const progressCallback = await createProgressCallback(job);
  
  // Initialize progress
  await progressCallback(0, 'Initializing LangGraph execution...', 'initialization');

  try {
    // Use streaming execution for real-time progress updates
    let finalState: ReportState | undefined;
    
    console.log(`[LangGraph Worker] Starting streaming execution for ${domain}`);
    
    // Stream the graph execution with progress updates
    for await (const state of streamReportGeneration(
      domain,
      reportTier as ReportTier,
      reportId.toString()
    )) {
      finalState = state;
      
      // Update progress from state
      if (state.progress > 0) {
        await progressCallback(
          state.progress, 
          state.progressMessage || 'Processing...', 
          getStageFromProgress(state.progress)
        );
      }
      
      // Log key milestones
      if (state.websiteContent && !state.seoMetrics) {
        console.log(`[LangGraph Worker] Website content extracted for ${domain}`);
      }
      if (state.seoMetrics && !state.technicalAnalysis) {
        console.log(`[LangGraph Worker] SEO metrics collected for ${domain}`);
      }
      if (state.technicalAnalysis && !state.contentAnalysis) {
        console.log(`[LangGraph Worker] Technical analysis completed for ${domain}`);
      }
      if (state.finalReport) {
        console.log(`[LangGraph Worker] Final report compiled for ${domain}`);
      }
    }

    if (!finalState) {
      throw new Error('Graph execution completed but no final state received');
    }

    console.log(`[LangGraph Worker] Graph execution completed for ${domain}`);

    // Ensure we have a final report
    if (!finalState.finalReport) {
      throw new Error('Graph execution completed but no final report generated');
    }

    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Update final progress
    await progressCallback(100, 'Report generation completed', 'completed');
    
    // Update report status in database
    await updateReportStatus(reportId, 'completed', finalState.finalReport);
    
    // Log completion metrics
    console.log(`[LangGraph Worker] Report completed for ${domain}:`);
    console.log(`  - Processing time: ${Math.round(processingTime / 1000)}s`);
    console.log(`  - Final progress: ${finalState.progress}%`);
    console.log(`  - Errors encountered: ${finalState.errors.length}`);
    console.log(`  - Report tier: ${finalState.tier}`);
    
    // Return compatible format for existing system
    return transformLangGraphResultToLegacyFormat(finalState, processingTime);
    
  } catch (error) {
    console.error(`[LangGraph Worker] Error processing ${domain}:`, error);
    
    // Update progress to show error
    await progressCallback(100, 'Report generation failed', 'error');
    
    // Update report status with error
    await updateReportStatus(
      reportId, 
      'failed', 
      undefined, 
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    // For now, let's return a fallback instead of throwing
    // This maintains compatibility with existing error handling
    return generateLangGraphFallback(domain, reportTier as ReportTier, error);
  }
}

/**
 * Resume failed report from checkpoint
 * This function will be implemented when PostgreSQL checkpointing is added
 */
export async function resumeFailedReport(
  reportId: string,
  checkpointId?: string
): Promise<ReportState> {
  // TODO: Implement checkpoint-based recovery
  // This will integrate with PostgreSQL checkpointer when implemented
  console.log(`[LangGraph Worker] Resume from checkpoint not yet implemented for ${reportId}`);
  throw new Error('Checkpoint-based recovery not yet implemented');
}

/**
 * Transform LangGraph result to legacy format for compatibility
 */
function transformLangGraphResultToLegacyFormat(
  state: ReportState,
  processingTime: number
): any {
  const { finalReport, domain, tier } = state;
  
  if (!finalReport) {
    throw new Error('Final report not available for transformation');
  }
  
  return {
    domain,
    reportTier: tier,
    generatedAt: finalReport.metadata?.generatedAt || new Date().toISOString(),
    analysis: generateLegacyAnalysisText(finalReport),
    recommendations: finalReport.recommendations || [],
    score: finalReport.metadata?.overallScore || 75,
    metadata: {
      ...finalReport.metadata,
      processingTime,
      executionEngine: 'langgraph',
      graphVersion: '1.0.0',
      nodeExecutionStats: {
        websiteContent: !!state.websiteContent,
        seoMetrics: !!state.seoMetrics,
        screenshots: (state.screenshots?.length || 0) > 0,
        competitors: (state.competitorData?.length || 0) > 0,
        technicalAnalysis: !!state.technicalAnalysis,
        contentAnalysis: !!state.contentAnalysis,
        strategicAnalysis: !!state.strategicAnalysis,
        competitiveAnalysis: !!state.competitiveAnalysis
      },
      errorCount: state.errors.length,
      retryCount: Object.keys(state.retries || {}).length
    },
    tierFeatures: generateTierSpecificFeatures(tier, finalReport),
    // Include raw LangGraph data for debugging/analysis
    langGraphData: {
      state: {
        progress: state.progress,
        errors: state.errors,
        startTime: state.startTime,
        endTime: state.endTime
      },
      finalReport
    }
  };
}

/**
 * Generate legacy analysis text format from structured report
 */
function generateLegacyAnalysisText(finalReport: any): string {
  const { executiveSummary, keyFindings } = finalReport;
  
  let analysisText = `# Website Analysis Report\n\n`;
  
  if (executiveSummary) {
    analysisText += `## Executive Summary\n\n${executiveSummary}\n\n`;
  }
  
  if (keyFindings) {
    analysisText += `## Key Findings\n\n`;
    
    if (keyFindings.technical) {
      analysisText += `### Technical Analysis\n${JSON.stringify(keyFindings.technical, null, 2)}\n\n`;
    }
    
    if (keyFindings.content) {
      analysisText += `### Content Analysis\n${JSON.stringify(keyFindings.content, null, 2)}\n\n`;
    }
    
    if (keyFindings.strategic) {
      analysisText += `### Strategic Analysis\n${JSON.stringify(keyFindings.strategic, null, 2)}\n\n`;
    }
    
    if (keyFindings.competitive) {
      analysisText += `### Competitive Analysis\n${JSON.stringify(keyFindings.competitive, null, 2)}\n\n`;
    }
  }
  
  return analysisText;
}

/**
 * Generate tier-specific features for legacy compatibility
 */
function generateTierSpecificFeatures(tier: ReportTier, finalReport: any): any {
  const baseFeatures = {
    executionEngine: 'langgraph',
    tier,
    analysisDepth: finalReport.metadata?.analysisDepth,
    featuresIncluded: finalReport.metadata?.featuresIncluded || []
  };
  
  switch (tier) {
    case 'lite':
      return {
        ...baseFeatures,
        basicSeo: finalReport.keyFindings?.technical || {},
        quickWins: (finalReport.recommendations || []).slice(0, 5),
        scope: 'Basic SEO fundamentals and quick wins'
      };
      
    case 'pro':
      return {
        ...baseFeatures,
        advancedSeo: finalReport.keyFindings?.technical || {},
        contentStrategy: finalReport.keyFindings?.content || {},
        visualAnalysis: finalReport.analysisDetails?.screenshots || [],
        competitiveIntel: finalReport.analysisDetails?.competitors || [],
        scope: 'Advanced analysis with competitive insights'
      };
      
    case 'elite':
      return {
        ...baseFeatures,
        comprehensiveAudit: finalReport.keyFindings || {},
        strategicInsights: finalReport.keyFindings?.strategic || {},
        competitiveAnalysis: finalReport.keyFindings?.competitive || {},
        implementationRoadmap: finalReport.implementationRoadmap,
        roiEstimates: finalReport.roiEstimates,
        scope: 'Enterprise-level strategic analysis'
      };
      
    case 'tasklist-pro':
      return {
        ...baseFeatures,
        comprehensiveAudit: finalReport.keyFindings || {},
        strategicInsights: finalReport.keyFindings?.strategic || {},
        competitiveAnalysis: finalReport.keyFindings?.competitive || {},
        implementationRoadmap: finalReport.implementationRoadmap,
        roiEstimates: finalReport.roiEstimates,
        actionableTasks: finalReport.tasklist || [],
        exportFormats: ['asana', 'notion', 'csv'],
        scope: 'Executive analysis with actionable task list'
      };
      
    default:
      return baseFeatures;
  }
}

/**
 * Get stage name from progress percentage
 */
function getStageFromProgress(progress: number): string {
  if (progress < 10) return 'initialization';
  if (progress < 30) return 'data_collection';
  if (progress < 50) return 'content_analysis';
  if (progress < 70) return 'seo_analysis';
  if (progress < 85) return 'competitive_analysis';
  if (progress < 95) return 'strategic_analysis';
  if (progress < 100) return 'compilation';
  return 'completed';
}

/**
 * Generate fallback response when LangGraph fails
 */
function generateLangGraphFallback(
  domain: string, 
  tier: ReportTier, 
  error: unknown
): any {
  return {
    domain,
    reportTier: tier,
    generatedAt: new Date().toISOString(),
    analysis: `# LangGraph Analysis Temporarily Unavailable\n\nWe encountered technical difficulties while analyzing ${domain} using our advanced LangGraph system.\n\n## Error Information\n\n${error instanceof Error ? error.message : 'Unknown execution error'}\n\n## Fallback Recommendations\n\n1. **Retry Analysis**: The issue may be temporary - try generating the report again\n2. **Check System Status**: Verify that all required services are running\n3. **Contact Support**: If the issue persists, please contact our technical team\n4. **Manual Review**: Consider conducting a manual website audit while we resolve this issue\n\n## General SEO Best Practices\n\nWhile we resolve this technical issue, here are some universal recommendations:\n\n- Optimize page loading speed (target under 3 seconds)\n- Ensure all pages have unique, descriptive title tags\n- Write compelling meta descriptions for better click-through rates\n- Verify mobile responsiveness across all devices\n- Check for broken links and fix 404 errors\n- Optimize images with proper alt text\n- Implement clean, descriptive URL structure\n- Use proper heading hierarchy (H1, H2, H3)\n- Add internal links to improve navigation\n- Monitor Core Web Vitals scores regularly`,
    recommendations: [
      {
        priority: 'critical',
        title: 'Retry LangGraph Analysis',
        description: 'The advanced analysis system encountered an error and should be retried',
        impact: 'Enables completion of comprehensive website analysis',
        effort: 'low',
        timeframe: 'Immediate'
      },
      {
        priority: 'high',
        title: 'System Health Check',
        description: 'Verify all analysis services are functioning properly',
        impact: 'Ensures reliable report generation',
        effort: 'medium',
        timeframe: '1-2 hours'
      },
      {
        priority: 'medium',
        title: 'Manual Website Audit',
        description: 'Conduct manual SEO audit while technical issues are resolved',
        impact: 'Provides immediate actionable insights',
        effort: 'high',
        timeframe: '1-2 weeks'
      }
    ],
    score: 50, // Lower score to indicate incomplete analysis
    metadata: {
      analysisType: 'langgraph_fallback',
      executionEngine: 'langgraph_failed',
      error: error instanceof Error ? error.message : 'Unknown execution error',
      fallbackUsed: true,
      recommendRetry: true,
      processingTime: 0,
      timestamp: new Date().toISOString()
    },
    tierFeatures: {
      executionEngine: 'langgraph_fallback',
      tier,
      error: 'LangGraph execution failed',
      fallbackGenerated: true
    }
  };
}