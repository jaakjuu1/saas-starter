/**
 * Quick MCP Health Check
 * Validates environment and basic connectivity
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

function checkEnvironment() {
  console.log('🔍 Environment Check...');
  
  const required = [
    'ANTHROPIC_API_KEY',
    'FIRECRAWL_API_KEY', 
    'DATAFORSEO_LOGIN',
    'DATAFORSEO_PASSWORD'
  ];
  
  const missing = [];
  
  for (const env of required) {
    if (!process.env[env]) {
      missing.push(env);
    } else {
      console.log(`✅ ${env}: Set`);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    return false;
  }
  
  return true;
}

function checkFiles() {
  console.log('\n📁 File Check...');
  
  const requiredFiles = [
    '.mcp.json',
    'lib/mcp/server-manager.ts',
    'lib/mcp/mcp-client.ts',
    'lib/mcp/tools/firecrawl-client.ts',
    'lib/mcp/tools/playwright-client.ts',
    'lib/mcp/tools/dataforseo-client.ts',
  ];
  
  const missing = [];
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}: Found`);
    } else {
      missing.push(file);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing files:', missing);
    return false;
  }
  
  return true;
}

function checkPackages() {
  console.log('\n📦 Package Check...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const required = [
      'firecrawl-mcp',
      '@playwright/mcp',
      'dataforseo-mcp-server',
      '@modelcontextprotocol/sdk'
    ];
    
    const missing = [];
    
    for (const pkg of required) {
      if (deps[pkg]) {
        console.log(`✅ ${pkg}: ${deps[pkg]}`);
      } else {
        missing.push(pkg);
      }
    }
    
    if (missing.length > 0) {
      console.error('❌ Missing packages:', missing);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error reading package.json:', error.message);
    return false;
  }
}

function checkMcpConfig() {
  console.log('\n⚙️  MCP Config Check...');
  
  try {
    const config = JSON.parse(fs.readFileSync('.mcp.json', 'utf-8'));
    
    if (!config.mcpServers) {
      console.error('❌ No mcpServers in config');
      return false;
    }
    
    const servers = Object.keys(config.mcpServers);
    console.log(`✅ Found ${servers.length} server configs: ${servers.join(', ')}`);
    
    // Check each server config
    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      if (!serverConfig.command) {
        console.error(`❌ ${name}: Missing command`);
        return false;
      }
      console.log(`✅ ${name}: Command '${serverConfig.command}'`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error reading .mcp.json:', error.message);
    return false;
  }
}

async function quickHealthCheck() {
  console.log('🏥 MCP Infrastructure Health Check\n');
  
  const checks = [
    checkEnvironment,
    checkFiles,
    checkPackages,
    checkMcpConfig,
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      const result = await check();
      if (!result) {
        allPassed = false;
      }
    } catch (error) {
      console.error('❌ Check failed:', error.message);
      allPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('✅ All health checks passed! System ready for testing.');
    console.log('\nNext steps:');
    console.log('1. Run: node test-mcp-infrastructure.js');
    console.log('2. Or test individual components');
  } else {
    console.log('❌ Some health checks failed. Please fix the issues above.');
  }
  
  return allPassed;
}

// Run if executed directly
if (require.main === module) {
  quickHealthCheck()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Health check crashed:', error);
      process.exit(1);
    });
}

module.exports = { quickHealthCheck };