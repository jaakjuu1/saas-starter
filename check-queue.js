const { Queue } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const reportQueue = new Queue('report-generation', { connection });

async function checkQueue() {
  const waiting = await reportQueue.getWaitingCount();
  const active = await reportQueue.getActiveCount();
  const completed = await reportQueue.getCompletedCount();
  const failed = await reportQueue.getFailedCount();
  
  console.log('Queue Status:');
  console.log('- Waiting:', waiting);
  console.log('- Active:', active);
  console.log('- Completed:', completed);
  console.log('- Failed:', failed);
  
  const jobs = await reportQueue.getJobs(['waiting', 'active', 'failed']);
  console.log('\nJobs:');
  jobs.forEach(job => {
    console.log(`- Job ${job.id}: ${job.name} (Status: ${job.failedReason ? 'Failed' : 'Pending'})`);
    if (job.failedReason) {
      console.log(`  Failed Reason: ${job.failedReason}`);
    }
    if (job.data) {
      console.log(`  Data: domain=${job.data.domain}, tier=${job.data.reportTier}`);
    }
  });
  
  await connection.quit();
}

checkQueue().catch(console.error);