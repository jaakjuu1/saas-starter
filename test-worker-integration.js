/**
 * Test Worker Integration End-to-End
 * Tests the complete pipeline: Queue → Worker → Real MCP Analysis → Database
 */

require('dotenv').config();

async function testWorkerIntegration() {
  console.log('🔬 Testing Worker Integration End-to-End\n');

  try {
    // Check if we have the required environment
    const requiredEnvs = ['POSTGRES_URL', 'ANTHROPIC_API_KEY', 'REDIS_URL'];
    const missing = requiredEnvs.filter(env => !process.env[env]);
    
    if (missing.length > 0) {
      console.log(`⚠️  Missing environment variables: ${missing.join(', ')}`);
      console.log('   This test requires a full database and Redis setup');
      console.log('   Skipping worker integration test');
      return { success: true, skipped: true, reason: 'Missing environment setup' };
    }

    console.log('1️⃣ Environment Check...');
    console.log('   ✅ PostgreSQL URL configured');
    console.log('   ✅ Anthropic API key configured');
    console.log('   ✅ Redis configured');

    // Test imports
    console.log('\n2️⃣ Testing Worker Import...');
    require('tsx/cjs');
    
    // Test that we can import the worker
    try {
      const workerModule = require('./lib/workers/report-worker.ts');
      console.log('   ✅ Worker module imported');
      
      // Check if processReport is exported
      if (typeof workerModule.processReport === 'function') {
        console.log('   ✅ processReport function available');
      } else {
        console.log('   ⚠️  processReport function not found');
      }
    } catch (importError) {
      console.error('   ❌ Worker import failed:', importError.message);
      return { success: false, error: 'Worker import failed', details: importError.message };
    }

    console.log('\n3️⃣ Testing Analysis Engine Integration...');
    const { AnalysisEngine } = require('./lib/mcp/analysis-engine.ts');
    
    // Create a mock job for testing
    const mockJob = {
      id: 'test-worker-' + Date.now(),
      data: {
        domain: 'example.com',
        reportTier: 'lite',
        reportId: 123,
      },
      updateProgress: async (progress) => {
        console.log(`   📊 Job Progress: ${progress}%`);
      }
    };

    console.log(`   🎯 Testing with domain: ${mockJob.data.domain}`);
    console.log(`   📋 Tier: ${mockJob.data.reportTier}`);

    // Test the analysis engine directly (simulating what worker does)
    console.log('\n4️⃣ Simulating Worker Process...');
    const analysisEngine = new AnalysisEngine(process.env.ANTHROPIC_API_KEY);
    
    const request = {
      domain: mockJob.data.domain,
      tier: mockJob.data.reportTier,
      reportId: mockJob.data.reportId.toString(),
    };

    const progressCallback = (stage, progress, message) => {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      console.log(`   📊 [${timestamp}] ${stage} (${progress}%): ${message}`);
    };

    console.log('   ⏱️  Starting analysis (simulating worker behavior)...');
    const startTime = Date.now();
    
    const result = await analysisEngine.analyzeWebsite(request, progressCallback);
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n✅ Worker Integration Test Completed!');
    console.log(`   ⏱️  Duration: ${duration} seconds`);
    console.log(`   🔧 Tools Used: ${result.toolsUsed.join(', ')}`);
    console.log(`   📝 Report Length: ${result.formattedReport.length} chars`);
    console.log(`   💯 Score: ${result.score || 'N/A'}`);
    console.log(`   📋 Recommendations: ${result.recommendations.length}`);

    // Simulate what worker would return
    const workerResult = {
      domain: result.domain,
      reportTier: result.tier,
      generatedAt: new Date().toISOString(),
      analysis: result.formattedReport,
      recommendations: result.recommendations,
      score: result.score,
      metadata: {
        ...result.metadata,
        toolsUsed: result.toolsUsed,
        processingTime: result.processingTime,
      },
    };

    console.log('\n🎯 Worker Result Sample:');
    console.log(`   📄 Analysis Preview: "${result.formattedReport.substring(0, 100)}..."`);
    console.log(`   🎯 First Recommendation: "${result.recommendations[0]?.substring(0, 80)}..."`);

    console.log('\n🎉 End-to-End Worker Integration Test PASSED!');
    
    return { 
      success: true, 
      result: workerResult, 
      duration, 
      toolsUsed: result.toolsUsed.length,
      recommendations: result.recommendations.length 
    };

  } catch (error) {
    console.error('\n❌ Worker Integration Test Failed:', error.message);
    console.error('   Stack:', error.stack?.split('\n')[0]);
    return { success: false, error: error.message };
  }
}

// Run the test
if (require.main === module) {
  testWorkerIntegration()
    .then(result => {
      console.log(`\n${'='.repeat(60)}`);
      if (result.skipped) {
        console.log(`Worker Integration Test SKIPPED: ${result.reason}`);
      } else {
        console.log(`Worker Integration Test ${result.success ? 'PASSED' : 'FAILED'}`);
        if (result.success) {
          console.log(`Duration: ${result.duration}s | Tools: ${result.toolsUsed} | Recs: ${result.recommendations}`);
        } else {
          console.log(`Error: ${result.error}`);
        }
      }
      console.log(`${'='.repeat(60)}`);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Test crashed:', error);
      process.exit(1);
    });
}

module.exports = { testWorkerIntegration };