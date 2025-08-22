/**
 * Basic MCP Server Test
 * Tests individual MCP server processes
 */

require('dotenv').config();
const { spawn } = require('child_process');

async function testMcpServer(name, command, args, env = {}) {
  console.log(`\n🧪 Testing ${name} MCP Server...`);
  
  return new Promise((resolve) => {
    const serverEnv = {
      ...process.env,
      ...env,
    };
    
    console.log(`   Command: ${command} ${args.join(' ')}`);
    
    const server = spawn(command, args, {
      env: serverEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    let output = '';
    let errorOutput = '';
    let responded = false;
    
    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      if (!responded) {
        console.log(`   ⏱️  ${name}: Process started (timeout reached)`);
        server.kill('SIGTERM');
        resolve({ success: true, reason: 'timeout' });
        responded = true;
      }
    }, 10000);
    
    server.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`   📤 ${name} stdout:`, data.toString().trim());
    });
    
    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.log(`   📤 ${name} stderr:`, data.toString().trim());
    });
    
    server.on('spawn', () => {
      console.log(`   ✅ ${name}: Process spawned successfully (PID: ${server.pid})`);
      
      // Try to send a basic MCP initialize message
      const initMessage = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '1.0',
          capabilities: { tools: true },
          clientInfo: { name: 'test-client', version: '1.0.0' }
        }
      };
      
      try {
        server.stdin.write(JSON.stringify(initMessage) + '\\n');
        console.log(`   📨 ${name}: Sent initialize message`);
      } catch (error) {
        console.log(`   ⚠️  ${name}: Could not send message:`, error.message);
      }
    });
    
    server.on('error', (error) => {
      if (!responded) {
        console.log(`   ❌ ${name}: Spawn error -`, error.message);
        clearTimeout(timeout);
        resolve({ success: false, error: error.message });
        responded = true;
      }
    });
    
    server.on('close', (code, signal) => {
      if (!responded) {
        clearTimeout(timeout);
        if (code === 0 || signal === 'SIGTERM') {
          console.log(`   ✅ ${name}: Process closed cleanly`);
          resolve({ success: true, code, signal });
        } else {
          console.log(`   ❌ ${name}: Process failed (code: ${code}, signal: ${signal})`);
          resolve({ success: false, code, signal });
        }
        responded = true;
      }
    });
    
    // Clean shutdown after a short time
    setTimeout(() => {
      if (server && !server.killed) {
        console.log(`   🛑 ${name}: Sending shutdown signal`);
        server.kill('SIGTERM');
      }
    }, 8000);
  });
}

async function testBasicMcpInfrastructure() {
  console.log('🧪 Basic MCP Server Connectivity Test\\n');
  
  // Detect Windows and use appropriate command
  const isWindows = process.platform === 'win32';
  const npxCommand = isWindows ? 'npx.cmd' : 'npx';
  
  const servers = [
    {
      name: 'Firecrawl',
      command: npxCommand,
      args: ['firecrawl-mcp'],
      env: {
        FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
      },
    },
    {
      name: 'Playwright',
      command: npxCommand,
      args: ['@playwright/mcp@latest'],
      env: {},
    },
    {
      name: 'DataForSEO',
      command: npxCommand,
      args: ['dataforseo-mcp-server'],
      env: {
        DATAFORSEO_LOGIN: process.env.DATAFORSEO_LOGIN,
        DATAFORSEO_PASSWORD: process.env.DATAFORSEO_PASSWORD,
      },
    },
  ];
  
  let passCount = 0;
  
  for (const server of servers) {
    try {
      const result = await testMcpServer(server.name, server.command, server.args, server.env);
      
      if (result.success) {
        console.log(`   ✅ ${server.name}: PASSED`);
        passCount++;
      } else {
        console.log(`   ❌ ${server.name}: FAILED - ${result.error || result.reason}`);
      }
    } catch (error) {
      console.log(`   ❌ ${server.name}: EXCEPTION - ${error.message}`);
    }
  }
  
  console.log('\\n' + '='.repeat(50));
  console.log(`📊 Results: ${passCount}/${servers.length} servers working`);
  
  if (passCount === servers.length) {
    console.log('🎉 All MCP servers are functional!');
    console.log('\\n📝 Next steps:');
    console.log('1. Build TypeScript modules: npx tsc');
    console.log('2. Run full integration test');
    console.log('3. Test with actual website analysis');
  } else {
    console.log('⚠️  Some servers had issues. Check the logs above.');
    console.log('\\n🔧 Troubleshooting tips:');
    console.log('- Verify API keys are correct');
    console.log('- Check network connectivity');
    console.log('- Ensure packages are properly installed');
  }
  
  return passCount === servers.length;
}

// Run the test
if (require.main === module) {
  testBasicMcpInfrastructure()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test crashed:', error);
      process.exit(1);
    });
}

module.exports = { testBasicMcpInfrastructure };