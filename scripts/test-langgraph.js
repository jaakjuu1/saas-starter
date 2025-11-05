#!/usr/bin/env node

/**
 * LangGraph Testing Script
 * 
 * Comprehensive testing of LangGraph implementation:
 * - Unit tests for nodes
 * - Integration tests for graph execution
 * - Error recovery testing
 * - Checkpoint functionality
 * - Performance benchmarks
 */

import { config } from 'dotenv';
import { execSync } from 'child_process';
import { performance } from 'perf_hooks';

// Load environment variables
config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${colors.bold}${colors.cyan}=== ${title} ===${colors.reset}\n`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

function runCommand(command, description) {
  logInfo(`Running: ${description}`);
  
  const startTime = performance.now();
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'inherit',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    const duration = Math.round(performance.now() - startTime);
    logSuccess(`${description} completed (${duration}ms)`);
    return true;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    logError(`${description} failed after ${duration}ms`);
    logError(`Error: ${error.message}`);
    return false;
  }
}

async function runTestSuite() {
  log(`${colors.bold}${colors.cyan}🧪 LangGraph Comprehensive Test Suite${colors.reset}\n`);
  
  const testSuites = [
    {
      name: 'Environment Setup Check',
      command: 'npx tsx scripts/setup-langgraph-dev.js',
      description: 'Verify development environment'
    },
    {
      name: 'Unit Tests - LangGraph Nodes',
      command: 'npm test -- tests/langgraph/nodes.test.ts',
      description: 'Test individual graph nodes'
    },
    {
      name: 'Integration Tests - Report Graph',
      command: 'npm test -- tests/langgraph/report-graph.test.ts',
      description: 'Test complete graph execution'
    },
    {
      name: 'Worker Integration Test',
      command: 'timeout 120 npx tsx test-worker-integration.js',
      description: 'Test worker with LangGraph integration'
    },
    {
      name: 'Lite Report Generation Test',
      command: 'timeout 120 npx tsx test-worker-lite.js',
      description: 'Test Lite tier report generation'
    },
    {
      name: 'System Health Check',
      command: 'npx tsx test-system-health.js',
      description: 'Overall system health validation'
    }
  ];
  
  const results = [];
  let totalDuration = 0;
  const overallStartTime = performance.now();
  
  for (const suite of testSuites) {
    logSection(suite.name);
    
    const startTime = performance.now();
    const success = runCommand(suite.command, suite.description);
    const duration = performance.now() - startTime;
    
    results.push({
      name: suite.name,
      success,
      duration: Math.round(duration)
    });
    
    totalDuration += duration;
    
    // Add spacing between test suites
    console.log('');
  }
  
  // Summary
  const overallDuration = Math.round(performance.now() - overallStartTime);
  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;
  
  logSection('Test Results Summary');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const duration = `${result.duration}ms`;
    log(`${status} ${result.name.padEnd(35)} (${duration})`);
  });
  
  console.log('');
  log(`📊 Total: ${results.length} tests, ${passed} passed, ${failed} failed`);
  log(`⏱️ Total duration: ${overallDuration}ms`);
  
  if (failed > 0) {
    logError(`\n${failed} test suite(s) failed. Please check the output above for details.`);
    logInfo('\nCommon issues and solutions:');
    logInfo('- Database not running: docker-compose up -d postgres redis');
    logInfo('- Missing API keys: check .env file');
    logInfo('- Node modules: pnpm install');
    logInfo('- TypeScript issues: pnpm build');
    return false;
  } else {
    logSuccess('\n🎉 All test suites passed! LangGraph implementation is working correctly.');
    logInfo('\nLangGraph is ready for production use.');
    return true;
  }
}

async function main() {
  try {
    // Check if required commands are available
    logInfo('Checking prerequisites...');
    
    try {
      execSync('npx --version', { stdio: 'ignore' });
      execSync('npm --version', { stdio: 'ignore' });
    } catch (error) {
      logError('npm/npx not available. Please install Node.js and npm.');
      process.exit(1);
    }
    
    // Check if we're in the right directory
    try {
      execSync('test -f package.json', { stdio: 'ignore' });
    } catch (error) {
      logError('package.json not found. Please run this script from the project root directory.');
      process.exit(1);
    }
    
    logSuccess('Prerequisites check passed');
    
    // Run the test suite
    const success = await runTestSuite();
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    logError(`Test script failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle interruption gracefully
process.on('SIGINT', () => {
  log('\n\n⚠️ Test suite interrupted by user');
  process.exit(130);
});

main();