#!/usr/bin/env node

/**
 * LangGraph Development Setup Script
 * 
 * This script sets up the development environment for LangGraph testing:
 * - Verifies database connectivity
 * - Tests Redis connection
 * - Validates environment variables
 * - Runs basic system health checks
 * - Creates test data if needed
 */

import { config } from 'dotenv';
import { db } from '../lib/db/drizzle.js';
import { Redis } from 'ioredis';
import { sql } from 'drizzle-orm';

// Load environment variables
config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

async function checkDatabaseConnection() {
  logInfo('Checking database connection...');
  
  try {
    const result = await db.execute(sql`SELECT 1 as test`);
    // Handle different result formats
    const firstRow = result[0] || result.rows?.[0];
    if (firstRow?.test === 1) {
      logSuccess('Database connection successful');
      return true;
    }
    throw new Error('Unexpected database response');
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    return false;
  }
}

async function checkRedisConnection() {
  logInfo('Checking Redis connection...');
  
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redis = new Redis(redisUrl);
  
  try {
    await redis.ping();
    logSuccess('Redis connection successful');
    await redis.disconnect();
    return true;
  } catch (error) {
    logError(`Redis connection failed: ${error.message}`);
    await redis.disconnect();
    return false;
  }
}

async function checkLangGraphTables() {
  logInfo('Checking LangGraph tables...');
  
  try {
    const checkpointCount = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'langgraph_checkpoints'
    `);
    
    // Handle different result formats
    const firstRow = checkpointCount[0] || checkpointCount.rows?.[0];
    if (parseInt(firstRow?.count) > 0) {
      logSuccess('LangGraph checkpoint table exists');
      return true;
    } else {
      logError('LangGraph checkpoint table missing - run migrations');
      return false;
    }
  } catch (error) {
    logError(`Table check failed: ${error.message}`);
    return false;
  }
}

function checkEnvironmentVariables() {
  logInfo('Checking environment variables...');
  
  const requiredVars = {
    'POSTGRES_URL': 'Database connection string',
    'REDIS_URL': 'Redis connection string',
    'ANTHROPIC_API_KEY': 'Claude API key for AI analysis',
    'LANGGRAPH_ENABLED': 'LangGraph feature flag'
  };
  
  const optionalVars = {
    'FIRECRAWL_API_KEY': 'Firecrawl API for web scraping',
    'DATAFORSEO_LOGIN': 'DataForSEO username',
    'DATAFORSEO_PASSWORD': 'DataForSEO password'
  };
  
  let allRequired = true;
  
  // Check required variables
  for (const [varName, description] of Object.entries(requiredVars)) {
    if (process.env[varName]) {
      logSuccess(`${varName}: Set`);
    } else {
      logError(`${varName}: Missing - ${description}`);
      allRequired = false;
    }
  }
  
  // Check optional variables
  for (const [varName, description] of Object.entries(optionalVars)) {
    if (process.env[varName]) {
      logSuccess(`${varName}: Set`);
    } else {
      logWarning(`${varName}: Not set - ${description} (optional)`);
    }
  }
  
  return allRequired;
}

async function checkDatabaseSchema() {
  logInfo('Checking database schema...');
  
  try {
    // Check for required columns in reportJobs
    const reportJobsSchema = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'report_jobs' 
      AND column_name IN ('progress_message', 'current_stage', 'execution_engine', 'checkpoint_id')
    `);
    
    // Handle different result formats
    const rows = reportJobsSchema.rows || reportJobsSchema;
    const columns = Array.isArray(rows) ? rows.map(row => row.column_name) : [];
    const requiredColumns = ['progress_message', 'current_stage', 'execution_engine', 'checkpoint_id'];
    
    const missingColumns = requiredColumns.filter(col => !columns.includes(col));
    
    if (missingColumns.length === 0) {
      logSuccess('Database schema up to date');
      return true;
    } else {
      logError(`Missing columns in report_jobs: ${missingColumns.join(', ')}`);
      return false;
    }
  } catch (error) {
    logError(`Schema check failed: ${error.message}`);
    return false;
  }
}

async function main() {
  log('\n🚀 LangGraph Development Environment Setup\n', colors.cyan);
  
  const checks = [
    { name: 'Environment Variables', fn: checkEnvironmentVariables },
    { name: 'Database Connection', fn: checkDatabaseConnection },
    { name: 'Redis Connection', fn: checkRedisConnection },
    { name: 'Database Schema', fn: checkDatabaseSchema },
    { name: 'LangGraph Tables', fn: checkLangGraphTables }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      const passed = await check.fn();
      if (!passed) allPassed = false;
    } catch (error) {
      logError(`${check.name} check failed: ${error.message}`);
      allPassed = false;
    }
    console.log(''); // Add spacing
  }
  
  if (allPassed) {
    logSuccess('🎉 All checks passed! LangGraph development environment is ready.');
    logInfo('\nNext steps:');
    logInfo('1. Start services: pnpm run worker (or docker-compose up worker)');
    logInfo('2. Run tests: npx tsx test-worker-integration.js');
    logInfo('3. Test LangGraph: npx tsx test-worker-lite.js');
  } else {
    logError('❌ Some checks failed. Please fix the issues above before proceeding.');
    logInfo('\nCommon fixes:');
    logInfo('- Run database migration: pnpm db:migrate');
    logInfo('- Start Redis: docker-compose up -d redis');
    logInfo('- Start PostgreSQL: docker-compose up -d postgres');
    logInfo('- Check .env file for missing variables');
  }
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
  logError(`Setup script failed: ${error.message}`);
  process.exit(1);
});