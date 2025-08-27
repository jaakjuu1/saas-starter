import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

// Redis connection - BullMQ requires maxRetriesPerRequest to be null
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  retryDelayOnFailover: 100,
});

// Report generation job data
export interface ReportJobData {
  reportId: number;
  domain: string;
  reportTier: 'lite' | 'pro' | 'elite' | 'tasklist_pro';
  ga4PropertyId?: string;
  userId: number;
  customerEmail: string;
}

// Job progress data
export interface ReportJobProgress {
  stage: string;
  progress: number; // 0-100
  message: string;
  details?: any;
}

// Create the report queue
export const reportQueue = new Queue<ReportJobData>('report-generation', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 50, // Keep last 50 completed jobs
    removeOnFail: 20, // Keep last 20 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    // Prevent premature stalling for long-running AI analysis
    stalledInterval: 600000, // 10 minutes - enough for Elite reports
  },
});

// Add a job to the queue
export async function addReportJob(data: ReportJobData): Promise<Job<ReportJobData>> {
  return await reportQueue.add('generate-report', data, {
    jobId: `report-${data.reportId}`, // Use report ID as job ID for easy tracking
  });
}

// Get job status
export async function getReportJobStatus(reportId: number) {
  const jobId = `report-${reportId}`;
  const job = await reportQueue.getJob(jobId);
  
  if (!job) {
    return null;
  }

  return {
    id: job.id,
    progress: job.progress,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    failedReason: job.failedReason,
    data: job.data,
    returnvalue: job.returnvalue,
  };
}

// Clean up old jobs
export async function cleanOldJobs() {
  await reportQueue.clean(24 * 60 * 60 * 1000, 100, 'completed'); // Clean completed jobs older than 24h
  await reportQueue.clean(7 * 24 * 60 * 60 * 1000, 50, 'failed'); // Clean failed jobs older than 7 days
}

// Queue health check
export async function getQueueHealth() {
  const waiting = await reportQueue.getWaiting();
  const active = await reportQueue.getActive();
  const completed = await reportQueue.getCompleted();
  const failed = await reportQueue.getFailed();

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    connection: connection.status,
  };
}