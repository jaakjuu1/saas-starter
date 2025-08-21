import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env') });

import reportWorker from '../lib/workers/report-worker';

console.log('🚀 Starting Claude Code SDK Report Worker...');
console.log(`📊 Worker Configuration:
- Concurrency: 2 jobs
- Rate Limit: 10 jobs per minute
- Queue: report-generation
- Redis: ${process.env.REDIS_URL || 'redis://localhost:6379'}
`);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Graceful shutdown initiated...');
  await reportWorker.close();
  console.log('✅ Worker shut down successfully');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Graceful shutdown initiated...');
  await reportWorker.close();
  console.log('✅ Worker shut down successfully');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('✅ Report worker started successfully!');