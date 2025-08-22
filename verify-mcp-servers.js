/**
 * Simple MCP Server Verification
 * Tests that all MCP packages are installed and executable
 */

require('dotenv').config();
const { execSync } = require('child_process');

async function verifyMcpServers() {
  console.log('🔍 Verifying MCP Server Packages...\n');
  
  const tests = [
    {
      name: 'Firecrawl MCP',
      command: 'npx firecrawl-mcp --help',
      expected: 'Firecrawl MCP',
    },
    {
      name: 'Playwright MCP',
      command: 'npx @playwright/mcp --help',
      expected: 'Usage: @playwright/mcp',
    },
    {
      name: 'DataForSEO MCP',
      command: 'npx dataforseo-mcp-server --help',
      expected: 'dataforseo-mcp-server',
    },
  ];
  
  let passCount = 0;
  
  for (const test of tests) {
    console.log(`Testing ${test.name}...`);
    
    try {
      // Execute with timeout
      const output = execSync(test.command, {
        timeout: 10000,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      
      console.log(`   Output length: ${output.length}`);
      console.log(`   First 200 chars: ${output.substring(0, 200)}`);
      
      if (output.includes(test.expected)) {
        console.log(`✅ ${test.name}: WORKING`);
        passCount++;
      } else {
        console.log(`⚠️  ${test.name}: UNEXPECTED OUTPUT`);
        console.log(`   Expected: ${test.expected}`);
      }
    } catch (error) {
      // Check stderr for expected output (some tools output help to stderr)
      const stderr = error.stderr ? error.stderr.toString() : '';
      const stdout = error.stdout ? error.stdout.toString() : '';
      const combined = stdout + stderr;
      
      console.log(`   Stderr length: ${stderr.length}`);
      console.log(`   Stdout length: ${stdout.length}`);
      console.log(`   Combined: ${combined.substring(0, 200)}`);
      
      if (combined.includes(test.expected)) {
        console.log(`✅ ${test.name}: WORKING (via stderr)`);
        passCount++;
      } else {
        console.log(`❌ ${test.name}: FAILED`);
        console.log(`   Error: ${error.message}`);
      }
    }
    
    console.log(''); // Empty line for spacing
  }
  
  console.log('='.repeat(50));
  console.log(`📊 Results: ${passCount}/${tests.length} MCP servers verified`);
  
  if (passCount === tests.length) {
    console.log('🎉 All MCP servers are installed and working!');
    console.log('\n📝 What this means:');
    console.log('✅ Firecrawl: Can scrape and extract website content');
    console.log('✅ Playwright: Can automate browsers and take screenshots');
    console.log('✅ DataForSEO: Can fetch SEO data and analytics');
    console.log('\n🚀 Next steps:');
    console.log('1. Test TypeScript compilation: npx tsc --noEmit');
    console.log('2. Test worker integration');
    console.log('3. Run end-to-end report generation');
  } else {
    console.log('⚠️  Some MCP servers need attention.');
  }
  
  return passCount === tests.length;
}

function checkEnvironment() {
  console.log('🔧 Environment Check...');
  
  const required = [
    'ANTHROPIC_API_KEY',
    'FIRECRAWL_API_KEY',
    'DATAFORSEO_LOGIN',
    'DATAFORSEO_PASSWORD',
  ];
  
  const missing = [];
  
  for (const env of required) {
    if (process.env[env]) {
      console.log(`✅ ${env}: Configured`);
    } else {
      missing.push(env);
    }
  }
  
  if (missing.length > 0) {
    console.log(`❌ Missing: ${missing.join(', ')}`);
    return false;
  }
  
  console.log('');
  return true;
}

async function runVerification() {
  console.log('🧪 MCP Infrastructure Verification\n');
  
  const envOk = checkEnvironment();
  if (!envOk) {
    console.log('❌ Environment issues detected. Please check your .env file.');
    return false;
  }
  
  const serversOk = await verifyMcpServers();
  
  return envOk && serversOk;
}

// Run if executed directly
if (require.main === module) {
  runVerification()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Verification crashed:', error);
      process.exit(1);
    });
}

module.exports = { runVerification };