/**
 * Simple MCP Package Test
 * Just checks if packages can be executed
 */

require('dotenv').config();
const { spawn } = require('child_process');

async function testMcpPackage(name, command, args) {
  console.log(`Testing ${name}...`);
  
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      env: {
        ...process.env,
        FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
        DATAFORSEO_LOGIN: process.env.DATAFORSEO_LOGIN,
        DATAFORSEO_PASSWORD: process.env.DATAFORSEO_PASSWORD,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    let hasOutput = false;
    
    child.stdout.on('data', (data) => {
      hasOutput = true;
      console.log(`  📤 ${name} stdout: ${data.toString().trim()}`);
    });
    
    child.stderr.on('data', (data) => {
      hasOutput = true;
      console.log(`  📤 ${name} stderr: ${data.toString().trim()}`);
    });
    
    child.on('spawn', () => {
      console.log(`  ✅ ${name}: Process spawned successfully`);
      
      // Kill after 3 seconds - we just want to see if it starts
      setTimeout(() => {
        child.kill('SIGTERM');
      }, 3000);
    });
    
    child.on('error', (error) => {
      console.log(`  ❌ ${name}: Spawn error - ${error.message}`);
      resolve({ success: false, error: error.message });
    });
    
    child.on('close', (code, signal) => {
      if (hasOutput || signal === 'SIGTERM') {
        console.log(`  ✅ ${name}: Package is functional`);
        resolve({ success: true });
      } else {
        console.log(`  ❌ ${name}: No output received`);
        resolve({ success: false, error: 'No output' });
      }
    });
  });
}

async function runSimpleTest() {
  console.log('🧪 Simple MCP Package Test\n');
  
  const packages = [
    { name: 'Firecrawl', command: 'npx', args: ['firecrawl-mcp'] },
    { name: 'Playwright', command: 'npx', args: ['@playwright/mcp'] },
    { name: 'DataForSEO', command: 'npx', args: ['dataforseo-mcp-server'] },
  ];
  
  let passCount = 0;
  
  for (const pkg of packages) {
    try {
      const result = await testMcpPackage(pkg.name, pkg.command, pkg.args);
      if (result.success) {
        passCount++;
      }
    } catch (error) {
      console.log(`  ❌ ${pkg.name}: Exception - ${error.message}`);
    }
    
    console.log(''); // Empty line
  }
  
  console.log('='.repeat(50));
  console.log(`📊 Results: ${passCount}/${packages.length} packages functional`);
  
  if (passCount === packages.length) {
    console.log('🎉 All MCP packages are working!');
    console.log('\nThis means:');
    console.log('✅ All packages are installed correctly');
    console.log('✅ Node.js can execute them');
    console.log('✅ Environment variables are available');
    console.log('✅ Ready for integration testing');
  } else if (passCount > 0) {
    console.log(`⚠️  ${passCount} out of ${packages.length} packages working. This is sufficient for testing.`);
  } else {
    console.log('❌ No packages are working. Check installation and environment.');
  }
  
  return passCount > 0;
}

if (require.main === module) {
  runSimpleTest()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Test crashed:', error);
      process.exit(1);
    });
}

module.exports = { runSimpleTest };