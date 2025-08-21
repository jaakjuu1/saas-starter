import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { reports, reportJobs } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { getReportJobStatus } from '@/lib/queue/report-queue';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = parseInt(params.id);
    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }

    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get report from database
    const report = await db
      .select()
      .from(reports)
      .where(
        and(
          eq(reports.id, reportId),
          eq(reports.userId, user.id) // Ensure user owns the report
        )
      )
      .limit(1);

    if (report.length === 0) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Get job status from database
    const jobRecord = await db
      .select()
      .from(reportJobs)
      .where(eq(reportJobs.reportId, reportId))
      .limit(1);

    // Get detailed job status from queue if available
    let queueStatus = null;
    if (jobRecord.length > 0) {
      queueStatus = await getReportJobStatus(reportId);
    }

    const reportData = report[0];
    const jobData = jobRecord[0] || null;

    return NextResponse.json({
      report: {
        id: reportData.id,
        domain: reportData.domain,
        reportType: reportData.reportType,
        status: reportData.status,
        createdAt: reportData.createdAt,
        updatedAt: reportData.updatedAt,
        completedAt: reportData.completedAt,
        reportData: reportData.reportData ? JSON.parse(reportData.reportData) : null,
        pdfUrl: reportData.pdfUrl
      },
      job: jobData ? {
        id: jobData.id,
        jobId: jobData.jobId,
        status: jobData.status,
        progress: jobData.progress,
        errorMessage: jobData.errorMessage,
        startedAt: jobData.startedAt,
        completedAt: jobData.completedAt
      } : null,
      queue: queueStatus
    });

  } catch (error) {
    console.error('Error fetching report status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}