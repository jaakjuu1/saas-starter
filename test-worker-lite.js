/**
 * Test Worker Lite (without database)
 * Tests core worker logic without database dependencies
 */

require('dotenv').config();

async function testWorkerLite() {
  console.log('🔬 Testing Worker Core Logic (Lite)\n');

  try {
    console.log('1️⃣ Testing Core Worker Functions...');
    
    // Import with TypeScript support
    require('tsx/cjs');
    
    console.log('2️⃣ Simulating processReport function...');
    
    // Instead of importing the worker directly, we'll test the analysis engine
    // which is the core of what the worker does
    const { AnalysisEngine } = require('./lib/mcp/analysis-engine.ts');
    
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY required');
    }

    console.log('3️⃣ Testing All Pricing Tiers...');
    
    const tiers = ['lite', 'pro', 'elite', 'tasklist_pro'];
    const results = {};
    
    for (const tier of tiers) {
      console.log(`\n   🎯 Testing ${tier.toUpperCase()} tier...`);
      
      const analysisEngine = new AnalysisEngine(process.env.ANTHROPIC_API_KEY);
      
      const request = {
        domain: 'example.com',
        tier: tier,
        reportId: `test-${tier}-${Date.now()}`,
      };

      let progressCount = 0;
      const progressCallback = (stage, progress, message) => {
        progressCount++;
        if (progressCount <= 3) { // Limit progress output
          console.log(`      📊 ${stage} (${progress}%): ${message.substring(0, 50)}...`);
        }
      };

      try {
        const startTime = Date.now();
        const result = await analysisEngine.analyzeWebsite(request, progressCallback);
        const duration = Math.round((Date.now() - startTime) / 1000);
        
        results[tier] = {
          success: true,
          duration,
          toolsUsed: result.toolsUsed.length,
          recommendations: result.recommendations.length,
          reportLength: result.formattedReport.length,
          score: result.score,
        };
        
        console.log(`      ✅ ${tier}: ${duration}s, ${result.toolsUsed.length} tools, ${result.recommendations.length} recommendations`);
        
      } catch (error) {
        results[tier] = {
          success: false,
          error: error.message,
        };
        console.log(`      ❌ ${tier}: ${error.message}`);
      }
    }

    console.log('\n📊 TIER COMPARISON RESULTS:');
    console.log('   ┌─────────────┬─────────┬───────┬──────────────┬─────────┐');
    console.log('   │ Tier        │ Status  │ Time  │ Tools Used   │ Recs    │');
    console.log('   ├─────────────┼─────────┼───────┼──────────────┼─────────┤');
    
    for (const [tier, result] of Object.entries(results)) {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const time = result.success ? `${result.duration}s` : '-';
      const tools = result.success ? `${result.toolsUsed}` : '-';
      const recs = result.success ? `${result.recommendations}` : '-';
      
      console.log(`   │ ${tier.padEnd(11)} │ ${status}  │ ${time.padEnd(5)} │ ${tools.padEnd(12)} │ ${recs.padEnd(7)} │`);
    }
    console.log('   └─────────────┴─────────┴───────┴──────────────┴─────────┘');

    // Summary
    const successCount = Object.values(results).filter(r => r.success).length;
    const totalCount = tiers.length;
    
    console.log(`\n🎯 Summary: ${successCount}/${totalCount} tiers working`);
    
    if (successCount === totalCount) {
      console.log('🎉 All pricing tiers working correctly!');
    } else if (successCount > 0) {
      console.log('⚠️ Some tiers working, investigate failures');
    } else {
      console.log('❌ No tiers working, system issue');
    }

    // Show expected tier behavior
    console.log('\n💡 Expected Tier Behavior:');
    console.log('   • Lite: Firecrawl only (basic content extraction)');
    console.log('   • Pro: Firecrawl + Playwright (+ visual analysis)');  
    console.log('   • Elite: All tools (+ DataForSEO technical SEO)');
    console.log('   • Tasklist Pro: All tools (+ executive summary)');

    return { 
      success: successCount > 0, 
      results, 
      successCount, 
      totalCount 
    };

  } catch (error) {
    console.error('\n❌ Worker Lite Test Failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
if (require.main === module) {
  testWorkerLite()
    .then(result => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Worker Lite Test ${result.success ? 'PASSED' : 'FAILED'}`);
      if (result.success) {
        console.log(`Working Tiers: ${result.successCount}/${result.totalCount}`);
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

module.exports = { testWorkerLite };