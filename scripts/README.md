# LangGraph Development Scripts

This directory contains scripts to set up, test, and validate the LangGraph implementation for the AI Website Growth Report SaaS.

## 🚀 Quick Start

### Windows Users
```bash
# Run the Windows setup script
scripts\setup-dev.bat
```

### Cross-Platform Setup
```bash
# Check environment and setup
pnpm setup:langgraph

# Run comprehensive tests
pnpm test:langgraph
```

## 📋 Available Scripts

### Setup Scripts

#### `setup-langgraph-dev.js`
**Purpose:** Comprehensive environment validation and setup for LangGraph development.

**Usage:**
```bash
npx tsx scripts/setup-langgraph-dev.js
# or
pnpm setup:langgraph
```

**What it checks:**
- ✅ Database connectivity (PostgreSQL)
- ✅ Redis connection
- ✅ Environment variables
- ✅ Database schema and migrations
- ✅ LangGraph tables
- ✅ API key validation

#### `setup-dev.bat` (Windows)
**Purpose:** Windows-specific setup script with Docker service management.

**Usage:**
```bash
scripts\setup-dev.bat
```

**What it does:**
- Starts Docker services (PostgreSQL + Redis)
- Runs environment checks
- Provides next steps guidance

### Testing Scripts

#### `test-langgraph.js`
**Purpose:** Comprehensive test suite runner for all LangGraph components.

**Usage:**
```bash
npx tsx scripts/test-langgraph.js
# or
pnpm test:langgraph
```

**Test suites included:**
- 🧪 Unit tests for LangGraph nodes
- 🔗 Integration tests for graph execution
- ⚙️ Worker integration tests
- 📊 Performance benchmarks
- 🏥 System health checks

## 🔧 Development Workflow

### First-Time Setup
```bash
# 1. Clone repository and install dependencies
pnpm install

# 2. Start database services
docker-compose up -d postgres redis

# 3. Run setup script
pnpm setup:langgraph

# 4. Run tests to verify everything works
pnpm test:langgraph
```

### Daily Development
```bash
# Start services
docker-compose up -d postgres redis

# Quick environment check
pnpm setup:langgraph

# Start development
pnpm dev          # Terminal 1: Next.js app
pnpm run worker   # Terminal 2: Worker process
```

### Testing LangGraph Features
```bash
# Run specific test suites
pnpm test:langgraph-nodes  # Unit tests for nodes
pnpm test:langgraph-graph  # Graph integration tests

# Test specific report tiers
npx tsx test-worker-lite.js         # Lite tier
npx tsx test-worker-integration.js  # All tiers
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Start PostgreSQL
docker-compose up -d postgres

# Verify connection string in .env
# Should be: postgresql://postgres:postgres@localhost:5432/saas_seo_ai
```

#### Redis Connection Failed
```bash
# Check if Redis is running
docker ps | grep redis

# Start Redis
docker-compose up -d redis

# Test connection
redis-cli ping
```

#### Missing Environment Variables
```bash
# Check .env file exists and has required variables
cat .env

# Required variables:
# POSTGRES_URL=postgresql://...
# REDIS_URL=redis://localhost:6379
# ANTHROPIC_API_KEY=sk-ant-...
# LANGGRAPH_ENABLED=true
```

#### Migration Issues
```bash
# Run migrations manually
pnpm db:migrate

# Check if tables exist
pnpm db:studio  # Opens Drizzle Studio
```

#### Test Failures
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- tests/langgraph/nodes.test.ts

# Check Jest configuration
cat jest.config.js
```

### Performance Issues

#### Slow Test Execution
- Increase timeout values in test scripts
- Check Docker resource allocation
- Verify API rate limits aren't being hit

#### Memory Issues
- Increase Node.js heap size: `NODE_OPTIONS="--max-old-space-size=4096"`
- Monitor memory usage during tests
- Check for memory leaks in long-running processes

## 📊 Environment Variables

### Required Variables
```bash
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/saas_seo_ai
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-ant-...
LANGGRAPH_ENABLED=true
```

### LangGraph Configuration
```bash
LANGGRAPH_ENABLED=true                    # Enable LangGraph features
LANGGRAPH_TIERS=lite,pro,elite,tasklist-pro  # Supported tiers
LANGGRAPH_ROLLOUT_PERCENTAGE=100          # Rollout percentage (0-100)
```

### Optional MCP Tool Variables
```bash
FIRECRAWL_API_KEY=fc-...     # Web scraping
DATAFORSEO_LOGIN=...         # SEO metrics
DATAFORSEO_PASSWORD=...      # SEO metrics password
```

## 📈 Performance Targets

### Test Execution Times
- Environment setup: < 10 seconds
- Unit tests: < 30 seconds
- Integration tests: < 60 seconds
- Full test suite: < 120 seconds

### Report Generation Targets
- Lite tier: < 3 minutes
- Pro tier: < 6 minutes
- Elite tier: < 12 minutes
- Tasklist Pro: < 10 minutes

## 🔍 Debugging Tips

### Enable Debug Logging
```bash
DEBUG=langgraph:* pnpm test:langgraph
```

### Check Database State
```bash
# Open database studio
pnpm db:studio

# Check checkpoint history
node -e "
const { getCheckpointHistory } = require('./lib/langgraph/checkpoints.js');
getCheckpointHistory('test-report-123').then(console.log);
"
```

### Monitor Worker Performance
```bash
# Start worker with verbose logging
NODE_ENV=development pnpm run worker

# Check BullMQ dashboard
open http://localhost:3001
```

## 🎯 Next Steps

After successful setup:
1. Run the full test suite: `pnpm test:langgraph`
2. Test report generation: `npx tsx test-worker-lite.js`
3. Start development: `pnpm dev` + `pnpm run worker`
4. Monitor performance: Open BullMQ dashboard at http://localhost:3001