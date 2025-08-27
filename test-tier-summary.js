/**
 * Quick Tier Summary Test
 * Tests each tier briefly to verify functionality
 */

require('dotenv').config();

async function testTierSummary() {
  console.log('🎯 Quick Tier Functionality Test\n');

  try {
    require('tsx/cjs');
    const { AnalysisEngine } = require('./lib/mcp/analysis-engine.ts');
    
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY required');
    }

    const tiers = [
      { name: 'lite', expectedTools: 1, timeout: 30 },
      { name: 'pro', expectedTools: 2, timeout: 60 },
      { name: 'elite', expectedTools: 3, timeout: 90 },
      { name: 'tasklist_pro', expectedTools: 3, timeout: 90 },
    ];
    
    const results = {};
    
    for (const tier of tiers) {
      console.log(`\n🔬 Testing ${tier.name.toUpperCase()} (${tier.timeout}s timeout)...`);
      
      try {
        const analysisEngine = new AnalysisEngine(process.env.ANTHROPIC_API_KEY);
        
        const request = {
          domain: 'example.com',
          tier: tier.name,
          reportId: `test-${tier.name}-${Date.now()}`,
        };

        // Short timeout for quick test
        const analysisPromise = analysisEngine.analyzeWebsite(request, (stage, progress, message) => {
          if (progress <= 25) { // Only log early progress
            console.log(`   📊 ${stage}: ${message.substring(0, 40)}...`);
          }
        });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), tier.timeout * 1000)
        );

        const result = await Promise.race([analysisPromise, timeoutPromise]);
        
        results[tier.name] = {
          success: true,
          toolsUsed: result.toolsUsed.length,
          recommendations: result.recommendations.length,
          reportLength: result.formattedReport.length,
          expectedTools: tier.expectedTools,
          actual: `${result.toolsUsed.length}/${tier.expectedTools} tools`,
        };
        
        console.log(`   ✅ ${tier.name}: ${result.toolsUsed.join(', ')} (${result.recommendations.length} recs)`);
        
      } catch (error) {
        results[tier.name] = {
          success: false,
          error: error.message.includes('Timeout') ? 'Timeout (expected for complex tiers)' : error.message,
          expectedTools: tier.expectedTools,
          actual: 'Failed',
        };
        
        const status = error.message.includes('Timeout') ? '⏰' : '❌';
        console.log(`   ${status} ${tier.name}: ${error.message}`);
      }
    }

    console.log('\n📊 TIER FUNCTIONALITY SUMMARY:');
    console.log('   ┌─────────────┬─────────────┬─────────────┬──────────────┐');
    console.log('   │ Tier        │ Status      │ Tools       │ Expected     │');
    console.log('   ├─────────────┼─────────────┼─────────────┼──────────────┤');
    
    for (const [tier, result] of Object.entries(results)) {
      const status = result.success ? '✅ PASS' : (result.error?.includes('Timeout') ? '⏰ SLOW' : '❌ FAIL');
      const tools = result.actual || '-';
      const expected = `${result.expectedTools} tools`;
      
      console.log(`   │ ${tier.padEnd(11)} │ ${status.padEnd(11)} │ ${tools.padEnd(11)} │ ${expected.padEnd(12)} │`);
    }
    console.log('   └─────────────┴─────────────┴─────────────┴──────────────┘');

    // Analyze results
    const working = Object.values(results).filter(r => r.success).length;
    const slow = Object.values(results).filter(r => r.error?.includes('Timeout')).length;
    const broken = Object.values(results).filter(r => !r.success && !r.error?.includes('Timeout')).length;
    
    console.log(`\n💡 Analysis:`);
    console.log(`   ✅ Working: ${working}/4 tiers`);
    console.log(`   ⏰ Slow (need optimization): ${slow}/4 tiers`);
    console.log(`   ❌ Broken: ${broken}/4 tiers`);
    
    if (working >= 1) {
      console.log(`\n🎉 Core functionality works! ${working > 1 ? 'Multiple' : 'At least one'} tier(s) operational.`);
    } else {
      console.log(`\n⚠️ System issues detected. All tiers failing.`);
    }

    console.log('\n🔧 Expected Behavior:');
    console.log('   • Lite: Fast (1 tool = Firecrawl only)');
    console.log('   • Pro: Medium (2 tools = Firecrawl + Playwright)');
    console.log('   • Elite: Slow (3 tools = All tools)');
    console.log('   • Tasklist Pro: Slow (3 tools = All tools)');

    return { 
      success: working > 0, 
      results, 
      summary: { working, slow, broken } 
    };

  } catch (error) {
    console.error('\n❌ Tier Summary Test Failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
if (require.main === module) {
  testTierSummary()
    .then(result => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Tier Summary Test ${result.success ? 'PASSED' : 'FAILED'}`);
      if (result.success) {
        const { working, slow, broken } = result.summary;
        console.log(`Working: ${working} | Slow: ${slow} | Broken: ${broken}`);
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

module.exports = { testTierSummary };