import { Worker, Job } from 'bullmq';
import { db } from '@/lib/db/drizzle';
import { reports, reportJobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ReportJobData, ReportJobProgress } from '@/lib/queue/report-queue';
import { AnalysisEngine, AnalysisRequest, EnhancedAnalysisResult } from '@/lib/mcp/analysis-engine';
import { processReportWithLangGraph } from './langgraph-worker';
import { processReportWithMultiAgent } from './multi-agent-worker';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Helper functions for report processing
async function updateJobProgress(
  job: Job<ReportJobData>,
  progress: ReportJobProgress
) {
  // Update job progress in BullMQ
  await job.updateProgress(progress.progress);
  
  // Update database record
  await db
    .update(reportJobs)
    .set({
      progress: progress.progress,
      status: progress.progress === 100 ? 'completed' : 'active',
      updatedAt: new Date()
    })
    .where(eq(reportJobs.reportId, job.data.reportId));

  console.log(`[Report ${job.data.reportId}] ${progress.stage}: ${progress.message}`);
}

async function updateReportStatus(reportId: number, status: string, data?: any) {
  const updateData: any = {
    status,
    updatedAt: new Date()
  };

  if (status === 'completed') {
    updateData.completedAt = new Date();
  }

  if (data) {
    updateData.reportData = JSON.stringify(data);
  }

  await db
    .update(reports)
    .set(updateData)
    .where(eq(reports.id, reportId));
}

// Legacy function - now handled by universal processReport function
// Kept for compatibility but redirects to new implementation
async function processLiteReport(job: Job<ReportJobData>): Promise<any> {
  return await processReport(job);
}

async function generateFallbackAnalysis(domain: string, reportTier: string, job: Job<ReportJobData>): Promise<any> {
  console.log(`Generating ultimate fallback analysis for ${domain} (${reportTier})`);
  
  await updateJobProgress(job, {
    stage: 'fallback_analysis',
    progress: 90,
    message: 'Using minimal analysis due to system limitations'
  });

  await updateJobProgress(job, {
    stage: 'completed',
    progress: 100,
    message: 'Minimal analysis completed'
  });

  // Return structured minimal analysis
  return {
    domain,
    reportTier,
    generatedAt: new Date().toISOString(),
    analysis: `# Analysis Temporarily Unavailable\n\nWe encountered technical difficulties while analyzing ${domain}.\n\n## General Recommendations\n\nWhile we resolve this issue, here are some universal best practices:\n\n1. Optimize page loading speed (target under 3 seconds)\n2. Ensure all pages have unique title tags and meta descriptions\n3. Verify mobile responsiveness across all devices\n4. Check for broken links and 404 errors\n5. Optimize images with proper alt text\n6. Implement clean URL structure\n7. Add structured data markup\n8. Use proper heading hierarchy (H1, H2, H3)\n9. Improve internal linking structure\n10. Monitor Core Web Vitals scores\n\n## Next Steps\n\n- Retry analysis in a few minutes\n- Contact support if issues persist\n- Consider manual website audit`,
    recommendations: [
      'Retry analysis after technical issues are resolved',
      'Verify website accessibility and performance manually',
      'Contact support if problems persist',
      'Review general SEO best practices checklist',
      'Consider upgrading for enhanced analysis capabilities',
    ],
    metadata: {
      analysisType: 'minimal_fallback',
      error: 'Complete system unavailable',
      toolsUsed: [],
      fallbackUsed: true,
    },
  };
}

/**
 * Feature flag configuration for execution engine selection
 */
function getExecutionEngine(domain: string, reportTier: string, reportId: number): 'multi-agent' | 'langgraph' | 'legacy' {
  // Priority 1: Check for Multi-Agent enablement (NEW DEFAULT)
  const multiAgentEnabled = process.env.MULTI_AGENT_ENABLED === 'true';
  if (multiAgentEnabled) {
    // Check for tier-specific rollout
    const multiAgentTiers = process.env.MULTI_AGENT_TIERS?.split(',') || [];
    if (multiAgentTiers.length === 0 || multiAgentTiers.includes(reportTier)) {
      console.log(`[Worker] Using MULTI-AGENT for ${domain} (${reportTier})`);
      return 'multi-agent';
    }
  }

  // Priority 2: Check for LangGraph
  const langGraphEnabled = process.env.LANGGRAPH_ENABLED === 'true';
  if (langGraphEnabled) {
    const langGraphTiers = process.env.LANGGRAPH_TIERS?.split(',') || [];
    if (langGraphTiers.length === 0 || langGraphTiers.includes(reportTier)) {
      const rolloutPercentage = parseInt(process.env.LANGGRAPH_ROLLOUT_PERCENTAGE || '100');
      const hash = reportId % 100;
      if (hash < rolloutPercentage) {
        console.log(`[Worker] Using LANGGRAPH for ${domain} (${reportTier})`);
        return 'langgraph';
      }
    }
  }

  // Priority 3: Default to legacy
  console.log(`[Worker] Using LEGACY for ${domain} (${reportTier})`);
  return 'legacy';
}

// Universal report processing function for all tiers
async function processReport(job: Job<ReportJobData>): Promise<any> {
  const { domain, reportTier, reportId } = job.data;

  // Get execution engine based on feature flags
  const engine = getExecutionEngine(domain, reportTier, reportId);

  try {
    switch (engine) {
      case 'multi-agent':
        console.log(`[Worker] Using Multi-Agent system for ${domain} (${reportTier}) - Report ${reportId}`);
        return await processReportWithMultiAgent(job);

      case 'langgraph':
        console.log(`[Worker] Using LangGraph for ${domain} (${reportTier}) - Report ${reportId}`);
        return await processReportWithLangGraph(job);

      case 'legacy':
      default:
        console.log(`[Worker] Using legacy processing for ${domain} (${reportTier}) - Report ${reportId}`);
        return await processReportLegacy(job);
    }
  } catch (error) {
    console.error(`[Worker] ${engine} processing failed for ${domain}, falling back to legacy:`, error);
    // Fallback to legacy if anything fails
    if (engine !== 'legacy') {
      console.log(`[Worker] Attempting fallback to legacy processing...`);
      return await processReportLegacy(job);
    }
    throw error; // Re-throw if legacy itself fails
  }
}

// Legacy report processing function (renamed from processReport)
async function processReportLegacy(job: Job<ReportJobData>): Promise<any> {
  const { domain, reportTier, reportId } = job.data;
  
  // Get Anthropic API key from environment
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  // Initialize the real analysis engine
  const analysisEngine = new AnalysisEngine(anthropicApiKey);

  // Create analysis request
  const request: AnalysisRequest = {
    domain,
    tier: reportTier as 'lite' | 'pro' | 'elite' | 'tasklist_pro',
    reportId: reportId.toString(),
  };

  // Create progress callback that updates job progress
  const progressCallback = async (stage: string, progress: number, message: string) => {
    await updateJobProgress(job, { stage, progress, message });
  };

  try {
    console.log(`[Worker] Starting real MCP analysis for ${domain} (${reportTier})`);
    
    // Perform real AI analysis with MCP tools
    const analysisResult: EnhancedAnalysisResult = await analysisEngine.analyzeWebsite(
      request,
      progressCallback
    );

    console.log(`[Worker] Analysis completed successfully for ${domain}`);
    console.log(`[Worker] Tools used: ${analysisResult.toolsUsed.join(', ')}`);
    console.log(`[Worker] Processing time: ${Math.round(analysisResult.metadata.analysisTime / 1000)}s`);

    // Return structured data compatible with existing report format
    return {
      domain: analysisResult.domain,
      reportTier: analysisResult.tier,
      generatedAt: new Date().toISOString(),
      analysis: analysisResult.formattedReport, // This is the main report content
      recommendations: analysisResult.recommendations,
      score: analysisResult.score,
      metadata: {
        ...analysisResult.metadata,
        toolsUsed: analysisResult.toolsUsed,
        context: analysisResult.context,
        processingTime: analysisResult.processingTime,
      },
      tierFeatures: getTierSpecificFeatures(reportTier, analysisResult),
    };

  } catch (error) {
    console.error(`[Worker] Real MCP analysis failed for ${domain}:`, error);
    
    // Try to get health status for debugging
    try {
      const healthStatus = await analysisEngine.getHealthStatus();
      console.log('[Worker] Analysis engine health:', healthStatus);
    } catch (healthError) {
      console.error('[Worker] Cannot get health status:', healthError);
    }
    
    // Fallback to minimal analysis if real analysis fails
    return await generateFallbackAnalysis(domain, reportTier, job);
  }
}

// Get tier-specific features from enhanced analysis result
function getTierSpecificFeatures(tier: string, analysisResult: EnhancedAnalysisResult): any {
  const { context, toolsUsed, metadata } = analysisResult;
  
  switch (tier) {
    case 'lite':
      return {
        basic_seo: {
          title: context.website.title,
          description: context.website.description,
          content_analysis: context.website.content ? 'Complete' : 'Limited',
          score: analysisResult.score || 70,
        },
        quick_wins: analysisResult.recommendations.slice(0, 5),
        tools_used: toolsUsed,
      };
    case 'pro':
      return {
        advanced_seo: context.seo || {},
        visual_analysis: context.ux || {},
        content_structure: {
          headings: context.website.headings,
          links: context.website.links,
          images: context.website.images,
        },
        detailed_recommendations: analysisResult.recommendations,
        tools_used: toolsUsed,
      };
    case 'elite':
      return {
        comprehensive_audit: {
          seo_score: context.seo?.score,
          technical_issues: context.seo?.issues?.length || 0,
          ux_analysis: !!context.ux,
          content_depth: context.website.content?.length || 0,
        },
        strategic_insights: {
          tools_successful: metadata.toolsSuccessful,
          analysis_depth: toolsUsed.length,
          processing_time: metadata.analysisTime,
        },
        implementation_roadmap: analysisResult.recommendations,
        tools_used: toolsUsed,
      };
    case 'tasklist_pro':
      return {
        executive_summary: {
          overall_score: analysisResult.score,
          issues_found: analysisResult.issues?.length || 0,
          recommendations_count: analysisResult.recommendations.length,
          tools_utilized: toolsUsed.length,
        },
        prioritized_tasks: analysisResult.recommendations.map((rec, index) => ({
          priority: index + 1,
          task: rec,
          estimated_effort: index < 3 ? 'Low' : index < 7 ? 'Medium' : 'High',
          impact: index < 5 ? 'High' : 'Medium',
        })),
        implementation_metrics: {
          total_processing_time: metadata.analysisTime,
          data_sources: toolsUsed,
          analysis_completeness: metadata.toolsSuccessful / 3 * 100 + '%',
        },
        tools_used: toolsUsed,
      };
    default:
      return {
        basic_analysis: context,
        tools_used: toolsUsed,
        metadata,
      };
  }
}

// Create the worker
export const reportWorker = new Worker<ReportJobData>(
  'report-generation',
  async (job) => {
    try {
      console.log(`[Worker] Starting report generation for job ${job.id}`, {
        reportId: job.data.reportId,
        domain: job.data.domain,
        tier: job.data.reportTier
      });
      
      // Update report status to processing  
      await updateReportStatus(job.data.reportId, 'processing');
      
      // Process the report using universal AI analysis function
      console.log(`[Worker] Processing report for ${job.data.domain}...`);
      const reportData = await processReport(job);
      
      // Update report with generated data
      console.log(`[Worker] Updating report status to completed for ${job.data.reportId}`);
      await updateReportStatus(job.data.reportId, 'completed', reportData);
      
      console.log(`[Worker] Completed report generation for job ${job.id}`);
      return reportData;
      
    } catch (error) {
      console.error(`Report generation failed for job ${job.id}:`, error);
      
      // Update report status to failed
      await updateReportStatus(job.data.reportId, 'failed');
      
      throw error;
    }
  },
  {
    connection,
    concurrency: 2, // Process 2 reports concurrently
    limiter: {
      max: 10,
      duration: 60 * 1000, // Max 10 jobs per minute
    },
    // Critical: Increase stall timeout for long-running AI analysis
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    lockDuration: 600000, // Lock job for 10 minutes (enough for Elite reports)
    lockRenewTime: 30000, // Renew lock every 30 seconds to prevent stalling
  }
);

// Worker event handlers
reportWorker.on('completed', (job) => {
  console.log(`Report ${job.id} completed successfully`);
});

reportWorker.on('failed', (job, err) => {
  console.error(`Report ${job?.id} failed:`, err.message);
});

reportWorker.on('progress', (job, progress) => {
  console.log(`Report ${job.id} progress: ${progress}%`);
});

// Export the processReport function for testing
export { processReport };

export default reportWorker;