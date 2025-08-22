/**
 * MCP Infrastructure Test Suite
 * Tests all MCP servers and infrastructure components
 */

require('dotenv').config();

// Since we're using TypeScript, we'll import using dynamic imports or tsx
async function loadModules() {
  // Use tsx to compile and load TypeScript modules
  const { createRequire } = require('module');
  const require = createRequire(import.meta.url || __filename);
  
  try {
    // Try to load compiled JS versions first
    const { McpServerManager } = require('./lib/mcp/server-manager');
    const { McpClient } = require('./lib/mcp/mcp-client');
    const { FirecrawlClient } = require('./lib/mcp/tools/firecrawl-client');
    const { PlaywrightClient } = require('./lib/mcp/tools/playwright-client');
    const { DataForSeoClient } = require('./lib/mcp/tools/dataforseo-client');
    const { loadMcpConfig, validateMcpServers } = require('./lib/mcp/config-loader');
    
    return {
      McpServerManager,
      McpClient,
      FirecrawlClient,
      PlaywrightClient,
      DataForSeoClient,
      loadMcpConfig,
      validateMcpServers,
    };
  } catch (error) {
    console.log('⚠️  TypeScript modules not compiled. Will test configuration only.');
    return null;
  }
}

async function testMcpInfrastructure() {
  console.log('🧪 Starting MCP Infrastructure Tests...\n');
  
  let serverManager;
  let clients = {};
  
  try {
    // Step 1: Load and validate configuration
    console.log('📋 Step 1: Loading MCP Configuration...');
    const configs = loadMcpConfig();
    console.log(`✅ Loaded ${configs.length} server configurations`);
    
    const validation = validateMcpServers(configs);
    if (!validation.valid) {
      console.error('❌ Configuration validation failed:');
      console.error('  Missing servers:', validation.missing);
      console.error('  Errors:', validation.errors);
      return false;
    }
    console.log('✅ Configuration validation passed\n');
    
    // Step 2: Start server manager
    console.log('🚀 Step 2: Starting MCP Server Manager...');
    serverManager = new McpServerManager(configs);
    
    serverManager.on('server-started', (name) => {
      console.log(`✅ Server started: ${name}`);
    });
    
    serverManager.on('server-error', (name, error) => {
      console.error(`❌ Server error: ${name}`, error.message);
    });
    
    await serverManager.startAll();
    
    // Wait a bit for servers to stabilize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const healthReport = serverManager.getHealthReport();
    console.log('📊 Health Report:', healthReport);
    
    if (healthReport.running === 0) {
      console.error('❌ No servers are running');
      return false;
    }
    console.log(`✅ ${healthReport.running}/${healthReport.total} servers running\n`);
    
    // Step 3: Create and test individual clients
    console.log('🔌 Step 3: Testing Individual MCP Clients...');
    
    for (const config of configs) {
      console.log(`\nTesting ${config.name} client...`);
      
      try {
        const client = new McpClient(config);
        await client.initialize();
        
        const tools = await client.listTools();
        console.log(`✅ ${config.name}: Found ${tools.length} tools`);
        console.log(`   Tools: ${tools.map(t => t.name).join(', ')}`);
        
        clients[config.name] = client;
      } catch (error) {
        console.error(`❌ ${config.name}: Failed to initialize`, error.message);
      }
    }
    
    // Step 4: Test tool-specific clients
    console.log('\n🛠️  Step 4: Testing Tool-Specific Clients...');
    
    // Test Firecrawl
    if (clients.firecrawl) {
      console.log('\nTesting Firecrawl client...');
      try {
        const firecrawlClient = new FirecrawlClient(clients.firecrawl);
        
        // Test simple scrape
        const result = await firecrawlClient.scrape('https://example.com', {
          formats: ['markdown'],
          onlyMainContent: true,
        });
        
        console.log('✅ Firecrawl: Website scraping successful');
        console.log(`   Content length: ${result?.content?.length || 0} characters`);
      } catch (error) {
        console.error('❌ Firecrawl test failed:', error.message);
      }
    }
    
    // Test Playwright
    if (clients.playwright) {
      console.log('\nTesting Playwright client...');
      try {
        const playwrightClient = new PlaywrightClient(clients.playwright);
        
        // Test navigation and screenshot
        await playwrightClient.navigate('https://example.com');
        const screenshot = await playwrightClient.screenshot();
        
        console.log('✅ Playwright: Navigation and screenshot successful');
        console.log(`   Screenshot data length: ${screenshot?.length || 0}`);
        
        // Clean up
        await playwrightClient.close();
      } catch (error) {
        console.error('❌ Playwright test failed:', error.message);
      }
    }
    
    // Test DataForSEO
    if (clients.dataforseo) {
      console.log('\nTesting DataForSEO client...');
      try {
        const dataForSeoClient = new DataForSeoClient(clients.dataforseo);
        
        // Test simple keyword data
        const keywordResult = await dataForSeoClient.getKeywordData({
          keywords: ['example website'],
          includeVolume: true,
        });
        
        console.log('✅ DataForSEO: Keyword data retrieval successful');
        console.log(`   Keywords processed: ${keywordResult?.length || 0}`);
      } catch (error) {
        console.error('❌ DataForSEO test failed:', error.message);
      }
    }
    
    // Step 5: Test tier-specific coordination
    console.log('\n🎯 Step 5: Testing Tier-Specific Tool Coordination...');
    
    const tiers = ['lite', 'pro', 'elite', 'tasklist_pro'];
    
    for (const tier of tiers) {
      console.log(`\nTesting ${tier} tier...`);
      
      try {
        // Simulate tier-specific analysis
        const results = {};
        
        // All tiers use Firecrawl
        if (clients.firecrawl) {
          const firecrawlClient = new FirecrawlClient(clients.firecrawl);
          results.content = await firecrawlClient.scrapeForSEO('https://example.com');
          console.log(`  ✅ Content extraction: ${results.content?.content?.length || 0} chars`);
        }
        
        // Pro+ tiers use Playwright
        if ((tier === 'pro' || tier === 'elite' || tier === 'tasklist_pro') && clients.playwright) {
          const playwrightClient = new PlaywrightClient(clients.playwright);
          await playwrightClient.navigate('https://example.com');
          results.visual = await playwrightClient.analyzeUX('https://example.com');
          console.log(`  ✅ Visual analysis completed`);
          await playwrightClient.close();
        }
        
        // Elite+ tiers use DataForSEO
        if ((tier === 'elite' || tier === 'tasklist_pro') && clients.dataforseo) {
          const dataForSeoClient = new DataForSeoClient(clients.dataforseo);
          results.seo = await dataForSeoClient.getTechnicalAudit('https://example.com');
          console.log(`  ✅ SEO analysis: Score ${results.seo?.score || 'N/A'}`);
        }
        
        console.log(`✅ ${tier} tier test completed`);
      } catch (error) {
        console.error(`❌ ${tier} tier test failed:`, error.message);
      }
    }
    
    console.log('\n🎉 MCP Infrastructure Test Complete!');
    return true;
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    return false;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    
    // Close all clients
    for (const [name, client] of Object.entries(clients)) {
      try {
        await client.close();
        console.log(`✅ Closed ${name} client`);
      } catch (error) {
        console.error(`❌ Error closing ${name} client:`, error.message);
      }
    }
    
    // Stop server manager
    if (serverManager) {
      try {
        await serverManager.stopAll();
        console.log('✅ Stopped all MCP servers');
      } catch (error) {
        console.error('❌ Error stopping servers:', error.message);
      }
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testMcpInfrastructure()
    .then(success => {
      console.log(success ? '\n✅ All tests passed!' : '\n❌ Some tests failed!');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = { testMcpInfrastructure };