/**
 * Test Real Analysis with Simple Domain
 * Tests actual MCP tool integration with a real website
 */

require('dotenv').config();

async function testRealAnalysis() {
  console.log('🔬 Testing Real Analysis with Simple Domain\n');

  try {
    // Import our analysis engine
    require('tsx/cjs');
    const { AnalysisEngine } = require('./lib/mcp/analysis-engine.ts');
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    console.log('1️⃣ Initializing Analysis Engine...');
    const analysisEngine = new AnalysisEngine(apiKey);
    
    // Test with a simple, fast-loading website
    const testDomain = 'example.com';
    const testTier = 'lite'; // Start with lite tier for speed
    
    console.log(`2️⃣ Testing Analysis for: ${testDomain} (${testTier} tier)`);
    
    const request = {
      domain: testDomain,
      tier: testTier,
      reportId: 'test-' + Date.now(),
    };

    // Create progress tracker
    const progressLog = [];
    const progressCallback = (stage, progress, message) => {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      const logEntry = `[${timestamp}] ${stage} (${progress}%): ${message}`;
      console.log(`   📊 ${logEntry}`);
      progressLog.push(logEntry);
    };

    console.log('3️⃣ Starting Real Analysis...');
    console.log('   ⏱️  This may take 1-3 minutes for lite tier...');
    
    const startTime = Date.now();
    
    try {
      const result = await analysisEngine.analyzeWebsite(
        request,
        progressCallback
      );
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      console.log('\n✅ Analysis Completed Successfully!');
      console.log(`⏱️  Duration: ${duration} seconds`);
      
      // Show results summary
      console.log('\n📊 Analysis Results:');
      console.log(`   🌐 Domain: ${result.domain}`);
      console.log(`   📋 Tier: ${result.tier}`);
      console.log(`   🔧 Tools Used: ${result.toolsUsed.join(', ')}`);
      console.log(`   💯 Score: ${result.score || 'N/A'}`);
      console.log(`   📝 Recommendations: ${result.recommendations.length}`);
      console.log(`   ⚙️  Processing Time: ${Math.round(result.processingTime / 1000)}s`);
      
      // Show some recommendations
      if (result.recommendations.length > 0) {
        console.log('\n🎯 Sample Recommendations:');
        result.recommendations.slice(0, 3).forEach((rec, i) => {
          console.log(`   ${i + 1}. ${rec.substring(0, 80)}${rec.length > 80 ? '...' : ''}`);
        });
      }
      
      // Show tools success
      console.log('\n🔧 Tool Performance:');
      console.log(`   ✅ Tools Successful: ${result.metadata.toolsSuccessful}`);
      console.log(`   ❌ Tools Failed: ${result.metadata.toolsFailed}`);
      console.log(`   🔄 Fallback Used: ${result.metadata.fallbackUsed ? 'Yes' : 'No'}`);
      
      // Show content sample
      if (result.context.website.content) {
        console.log('\n📄 Content Sample:');
        const contentSample = result.context.website.content.substring(0, 200);
        console.log(`   "${contentSample}${result.context.website.content.length > 200 ? '...' : ''}"`);
      }
      
      console.log('\n🎉 Real Analysis Test PASSED!');
      return { success: true, result, duration, progressLog };
      
    } catch (analysisError) {
      console.error('\n❌ Analysis Failed:', analysisError.message);
      console.log('\n📊 Progress Log:');
      progressLog.forEach(entry => console.log(`   ${entry}`));
      
      // Try to get health status for debugging
      try {
        const health = await analysisEngine.getHealthStatus();
        console.log('\n🏥 Health Status:', JSON.stringify(health, null, 2));
      } catch (healthError) {
        console.log('\n🏥 Cannot get health status:', healthError.message);
      }
      
      return { success: false, error: analysisError.message, progressLog };
    }

  } catch (error) {
    console.error('\n💥 Test Setup Failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
if (require.main === module) {
  testRealAnalysis()
    .then(result => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Real Analysis Test ${result.success ? 'PASSED' : 'FAILED'}`);
      if (result.success) {
        console.log(`Duration: ${result.duration}s | Tools: ${result.result.toolsUsed.length}`);
      } else {
        console.log(`Error: ${result.error}`);
      }
      console.log(`${'='.repeat(60)}`);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Test crashed:', error);
      process.exit(1);
    });
}

module.exports = { testRealAnalysis };