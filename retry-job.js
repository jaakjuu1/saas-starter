const { Queue } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const reportQueue = new Queue('report-generation', { connection });

async function retryJob(jobId) {
  try {
    const job = await reportQueue.getJob(jobId);
    if (!job) {
      console.log('Job not found:', jobId);
      return;
    }
    
    console.log('Retrying job:', jobId);
    console.log('Job data:', job.data);
    
    // Retry the job
    await job.retry();
    console.log('Job retried successfully!');
    
  } catch (error) {
    console.error('Error retrying job:', error);
  } finally {
    await connection.quit();
  }
}

// Retry job report-6
retryJob('report-6').catch(console.error);