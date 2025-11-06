/**
 * Multi-Agent Worker Integration
 *
 * Integrates the multi-agent system with BullMQ for async report generation.
 * Handles streaming execution, real-time progress updates, and error recovery.
 */

import { Job } from 'bullmq';
import { db } from '@/lib/db/drizzle';
import { reports, reportJobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ReportJobData } from '@/lib/queue/report-queue';
import { generateReport } from '../ai/agents/orchestrator';
import type { ReportTier } from '../ai/types/agent-types';

/**
 * Process report using multi-agent system
 */
export async function processReportWithMultiAgent(job: Job<ReportJobData>): Promise<any> {
  const { domain, reportTier, reportId } = job.data;
  const startTime = Date.now();

  console.log(`[Multi-Agent Worker] Starting ${reportTier} tier report for ${domain}`);

  // Validate tier
  const validTiers: ReportTier[] = ['lite', 'pro', 'elite', 'tasklist-pro'];
  if (!validTiers.includes(reportTier as ReportTier)) {
    throw new Error(`Invalid report tier: ${reportTier}`);
  }

  // Create progress callback
  const progressCallback = async (progress: number, message: string, stage: string) => {
    try {
      // Update BullMQ job progress
      await job.updateProgress(progress);

      // Update database
      await db
        .update(reportJobs)
        .set({
          progress,
          status: progress === 100 ? 'completed' : 'active',
          updatedAt: new Date(),
          progressMessage: message,
          currentStage: stage,
        })
        .where(eq(reportJobs.reportId, reportId));

      console.log(`[Multi-Agent ${reportId}] ${progress}% - ${stage}: ${message}`);
    } catch (error) {
      console.error(`[Multi-Agent ${reportId}] Progress update failed:`, error);
      // Don't throw - progress update failures shouldn't stop execution
    }
  };

  try {
    // Initialize progress
    await progressCallback(0, 'Initializing multi-agent system...', 'initialization');

    // Generate report using orchestrator
    const finalReport = await generateReport({
      domain,
      tier: reportTier as ReportTier,
      reportId: reportId.toString(),
      progressCallback,
    });

    const processingTime = Date.now() - startTime;
    console.log(`[Multi-Agent Worker] Report completed in ${Math.round(processingTime / 1000)}s`);

    // Update database with completed report
    await db
      .update(reports)
      .set({
        status: 'completed',
        reportData: JSON.stringify(finalReport),
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reports.id, reportId));

    // Update job status
    await db
      .update(reportJobs)
      .set({
        status: 'completed',
        progress: 100,
        progressMessage: 'Report generation complete',
        currentStage: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(reportJobs.reportId, reportId));

    // Return the report
    return {
      success: true,
      report: finalReport,
      metadata: {
        domain,
        tier: reportTier,
        processingTime,
        executionEngine: 'multi-agent',
        agentsUsed: finalReport.metadata.agentsUsed,
      },
    };

  } catch (error) {
    console.error(`[Multi-Agent Worker] Error processing ${domain}:`, error);

    // Update progress to show error
    await progressCallback(100, 'Report generation failed', 'error');

    // Update database with error
    await db
      .update(reports)
      .set({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: new Date(),
      })
      .where(eq(reports.id, reportId));

    await db
      .update(reportJobs)
      .set({
        status: 'failed',
        progress: 100,
        progressMessage: 'Report generation failed',
        currentStage: 'error',
        updatedAt: new Date(),
      })
      .where(eq(reportJobs.reportId, reportId));

    // Return error response
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        domain,
        tier: reportTier,
        processingTime: Date.now() - startTime,
        executionEngine: 'multi-agent',
      },
    };
  }
}

/**
 * Get report status
 */
export async function getReportStatus(reportId: number) {
  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);

  if (!report) {
    return null;
  }

  const [job] = await db
    .select()
    .from(reportJobs)
    .where(eq(reportJobs.reportId, reportId))
    .limit(1);

  return {
    report,
    job,
    progress: job?.progress || 0,
    status: report.status,
    currentStage: job?.currentStage,
    progressMessage: job?.progressMessage,
  };
}
