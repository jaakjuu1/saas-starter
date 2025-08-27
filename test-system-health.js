#!/usr/bin/env node

/**
 * System Health Check Script
 * Tests all critical components of the SaaS application
 */

const Redis = require('ioredis');
const postgres = require('postgres');
const axios = require('axios').default;

// Configuration
const config = {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
  postgres: process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/saas_seo_ai',
  webapp: process.env.BASE_URL || 'http://localhost:3000',
  bullBoard: 'http://localhost:3001'
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Helper functions
const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
};

// Test functions
async function testRedis() {
  log.info('Testing Redis connection...');
  const redis = new Redis(config.redis);
  
  try {
    const pong = await redis.ping();
    if (pong === 'PONG') {
      log.success('Redis is running');
      
      // Test write/read
      await redis.set('health:check', Date.now());
      const value = await redis.get('health:check');
      if (value) {
        log.success('Redis read/write working');
      }
      
      // Check queue keys
      const keys = await redis.keys('bull:report-generation:*');
      log.info(`Found ${keys.length} queue keys in Redis`);
      
      await redis.quit();
      return true;
    }
  } catch (error) {
    log.error(`Redis error: ${error.message}`);
    return false;
  }
}

async function testPostgres() {
  log.info('Testing PostgreSQL connection...');
  const sql = postgres(config.postgres);
  
  try {
    // Test connection
    const result = await sql`SELECT NOW()`;
    if (result.length > 0) {
      log.success('PostgreSQL is running');
    }
    
    // Check tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    const requiredTables = ['users', 'reports', 'report_jobs'];
    const existingTables = tables.map(r => r.table_name);
    
    for (const table of requiredTables) {
      if (existingTables.includes(table)) {
        log.success(`Table '${table}' exists`);
      } else {
        log.error(`Table '${table}' is missing`);
      }
    }
    
    // Check report count
    const reportCount = await sql`SELECT COUNT(*) FROM reports`;
    log.info(`Found ${reportCount[0].count} reports in database`);
    
    await sql.end();
    return true;
  } catch (error) {
    log.error(`PostgreSQL error: ${error.message}`);
    return false;
  }
}

async function testWebApp() {
  log.info('Testing Next.js application...');
  
  try {
    const response = await axios.get(config.webapp, { 
      timeout: 5000,
      validateStatus: () => true 
    });
    
    if (response.status === 200) {
      log.success('Web application is running');
      return true;
    } else {
      log.warning(`Web app returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log.error('Web application is not running');
    } else {
      log.error(`Web app error: ${error.message}`);
    }
    return false;
  }
}

async function testWorker() {
  log.info('Testing worker status via Redis...');
  const redis = new Redis(config.redis);
  
  try {
    // Check for worker keys
    const workerKeys = await redis.keys('bull:report-generation:worker:*');
    
    if (workerKeys.length > 0) {
      log.success(`Found ${workerKeys.length} worker(s) registered`);
      
      // Check last activity
      for (const key of workerKeys) {
        const workerData = await redis.get(key);
        if (workerData) {
          log.info(`Worker ${key.split(':').pop()} is registered`);
        }
      }
      
      await redis.quit();
      return true;
    } else {
      log.warning('No workers currently registered');
      log.info('Start the worker with: pnpm run worker');
      await redis.quit();
      return false;
    }
  } catch (error) {
    log.error(`Worker check error: ${error.message}`);
    return false;
  }
}

async function testBullBoard() {
  log.info('Testing Bull Dashboard...');
  
  try {
    const response = await axios.get(config.bullBoard, { 
      timeout: 3000,
      validateStatus: () => true 
    });
    
    if (response.status === 200) {
      log.success('Bull Dashboard is running');
      log.info(`View queue status at: ${config.bullBoard}`);
      return true;
    } else {
      log.warning('Bull Dashboard is not accessible');
      return false;
    }
  } catch (error) {
    log.warning('Bull Dashboard is not running (optional service)');
    return false;
  }
}

async function testEnvironmentVariables() {
  log.info('Checking environment variables...');
  
  const required = [
    'ANTHROPIC_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ];
  
  const optional = [
    'FIRECRAWL_API_KEY',
    'DATAFOR_SEO_LOGIN',
    'DATAFOR_SEO_PASSWORD'
  ];
  
  let allRequired = true;
  
  for (const key of required) {
    if (process.env[key]) {
      log.success(`${key} is set`);
    } else {
      log.error(`${key} is missing (REQUIRED)`);
      allRequired = false;
    }
  }
  
  for (const key of optional) {
    if (process.env[key]) {
      log.success(`${key} is set`);
    } else {
      log.warning(`${key} is not set (optional)`);
    }
  }
  
  return allRequired;
}

// Main execution
async function runHealthCheck() {
  console.log('\n' + colors.blue + '========================================' + colors.reset);
  console.log(colors.blue + '  AI Website Growth Report SaaS' + colors.reset);
  console.log(colors.blue + '  System Health Check' + colors.reset);
  console.log(colors.blue + '========================================' + colors.reset + '\n');
  
  const results = {
    redis: await testRedis(),
    postgres: await testPostgres(),
    webapp: await testWebApp(),
    worker: await testWorker(),
    bullBoard: await testBullBoard(),
    env: await testEnvironmentVariables()
  };
  
  console.log('\n' + colors.blue + '========================================' + colors.reset);
  console.log(colors.blue + '  Health Check Summary' + colors.reset);
  console.log(colors.blue + '========================================' + colors.reset + '\n');
  
  const critical = ['redis', 'postgres', 'webapp', 'worker', 'env'];
  const allCriticalPassing = critical.every(key => results[key]);
  
  if (allCriticalPassing) {
    log.success('All critical services are healthy! 🎉');
    console.log('\nYour application is ready to generate reports!');
  } else {
    log.error('Some critical services are not running');
    console.log('\nTo fix:');
    if (!results.redis) console.log('  1. Start Redis: docker-compose up -d redis');
    if (!results.postgres) console.log('  2. Start PostgreSQL: docker-compose up -d postgres');
    if (!results.webapp) console.log('  3. Start Next.js: pnpm dev');
    if (!results.worker) console.log('  4. Start Worker: pnpm run worker');
    if (!results.env) console.log('  5. Set missing environment variables in .env');
  }
  
  console.log('\n');
  process.exit(allCriticalPassing ? 0 : 1);
}

// Run the health check
runHealthCheck().catch(error => {
  console.error('Health check failed:', error);
  process.exit(1);
});