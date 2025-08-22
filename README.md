# AI Website Growth Report SaaS

An advanced AI-powered SaaS platform that generates comprehensive SEO, UX, and conversion optimization reports for websites using Claude Code SDK and specialized MCP tools.

**Demo: [https://next-saas-start.vercel.app/](https://next-saas-start.vercel.app/)**

## 🚀 Overview

This platform automates website analysis and generates actionable growth reports across 4 pricing tiers, from basic SEO audits to enterprise-level strategic recommendations. Built on Next.js with real-time AI analysis powered by Claude Code SDK.

## 💎 Report Tiers & Features

| Tier | Price | Analysis Depth | Completion Time | Key Features |
|------|-------|---------------|-----------------|--------------|
| **Lite** | €29 | Basic SEO fundamentals | < 3 minutes | • Meta tags analysis<br>• Content structure audit<br>• 3-5 quick wins<br>• Mobile responsiveness check |
| **Pro** | €69 | Advanced technical analysis | < 6 minutes | • Competitor insights<br>• Visual UX analysis<br>• Performance optimization<br>• 8-12 strategic recommendations |
| **Elite** | €149 | Enterprise strategic analysis | < 12 minutes | • Market positioning<br>• Implementation roadmap<br>• ROI projections<br>• 15+ comprehensive recommendations |
| **Tasklist Pro** | €299 | Executive task management | < 10 minutes | • 20+ prioritized tasks<br>• ROI calculations<br>• Export to Asana/Notion/CSV<br>• Resource planning |

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Frontend - Next.js"
        UI[User Interface]
        Payment[Stripe Payment]
        Progress[Real-time Progress]
        Report[Report Display]
    end
    
    subgraph "Backend Services"
        API[API Routes]
        Queue[BullMQ Job Queue]
        Worker[Claude Code SDK Worker]
        DB[(PostgreSQL)]
        Redis[(Redis)]
    end
    
    subgraph "AI Analysis Engine"
        MCP[MCP Client]
        Claude[Claude Code SDK]
        Tools[MCP Tools]
        Prompts[Tier-Specific Prompts]
    end
    
    subgraph "External Services"
        Stripe[Stripe API]
        Firecrawl[Firecrawl API]
        DataForSEO[DataForSEO API]
        Playwright[Playwright]
    end
    
    UI --> API
    Payment --> Stripe
    API --> Queue
    Queue --> Redis
    Queue --> Worker
    Worker --> MCP
    MCP --> Claude
    Claude --> Tools
    Tools --> Firecrawl
    Tools --> DataForSEO
    Tools --> Playwright
    Worker --> DB
    Progress --> DB
    Report --> DB
```

## 📊 Report Generation Workflow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Stripe
    participant API
    participant Queue
    participant Worker
    participant AI
    participant DB
    
    User->>Frontend: Select report tier
    Frontend->>Stripe: Process payment
    Stripe-->>API: Payment webhook
    API->>DB: Create report record
    API->>Queue: Add job to queue
    Queue->>Worker: Process job
    
    loop AI Analysis
        Worker->>AI: Request analysis
        AI->>AI: Extract content (Firecrawl)
        AI->>AI: SEO analysis (DataForSEO)
        AI->>AI: Visual analysis (Playwright)
        AI->>AI: Generate recommendations
        Worker->>DB: Update progress
        Frontend->>DB: Poll progress
        Frontend-->>User: Show progress
    end
    
    Worker->>DB: Save final report
    Frontend->>User: Display complete report
```

## 🧠 AI Analysis Pipeline

```mermaid
graph LR
    subgraph "Tier: Lite"
        L1[Content Extraction]
        L2[Basic SEO Audit]
        L3[Quick Wins]
    end
    
    subgraph "Tier: Pro"
        P1[Advanced SEO]
        P2[Visual Analysis]
        P3[Competitor Research]
        P4[Strategic Recommendations]
    end
    
    subgraph "Tier: Elite"
        E1[Market Analysis]
        E2[Strategic Planning]
        E3[ROI Projections]
        E4[Implementation Roadmap]
    end
    
    subgraph "Tier: Tasklist Pro"
        T1[Executive Summary]
        T2[Task Generation]
        T3[Priority Matrix]
        T4[Export Integration]
    end
    
    L1 --> L2 --> L3
    P1 --> P2 --> P3 --> P4
    E1 --> E2 --> E3 --> E4
    T1 --> T2 --> T3 --> T4
```

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Queue System**: [BullMQ](https://docs.bullmq.io/) with [Redis](https://redis.io/)
- **AI Engine**: [Claude Code SDK](https://docs.anthropic.com/en/docs/claude-code/sdk) with MCP tools
- **Payments**: [Stripe](https://stripe.com/) (one-time payments)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) with Tailwind CSS
- **Testing**: Jest with comprehensive unit and integration tests

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database
- Redis server
- Stripe account
- API keys for Firecrawl and DataForSEO (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/user/saas-seo-ai
cd saas-seo-ai

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
pnpm db:setup
pnpm db:migrate
pnpm db:seed
```

### Environment Variables

```env
# Database
POSTGRES_URL=postgres://user:password@localhost:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI Analysis Tools (optional)
FIRECRAWL_API_KEY=your_key_here
DATAFORSEO_API_KEY=your_key_here

# Application
BASE_URL=http://localhost:3000
AUTH_SECRET=your_auth_secret_here
```

### Running Locally

```bash
# Start the development server
pnpm dev

# In another terminal, start the worker
pnpm run worker

# (Optional) Listen for Stripe webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests
pnpm test:integration

# Generate coverage report
pnpm test:coverage

# Run system health check
npx tsx tests/run-tests.ts
```

## 📁 Project Structure

```
saas-seo-ai/
├── app/                    # Next.js app router pages
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API endpoints
│   ├── generate/          # Report generation UI
│   └── reports/           # Report viewing pages
├── lib/                   # Core application logic
│   ├── db/               # Database schema and migrations
│   ├── mcp/              # MCP client and configuration
│   ├── payments/         # Stripe integration
│   ├── prompts/          # Tier-specific AI prompts
│   ├── queue/            # BullMQ job queue
│   └── workers/          # Report generation workers
├── tests/                # Test suites
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── e2e/             # End-to-end tests
└── workers/             # Worker processes
```

## 🔄 Real-time Progress Tracking

The application provides real-time progress updates during report generation:

```mermaid
stateDiagram-v2
    [*] --> Initializing: Payment Complete
    Initializing --> ContentExtraction: 10%
    ContentExtraction --> VisualAnalysis: 25%
    VisualAnalysis --> SEOAudit: 40%
    SEOAudit --> PerformanceCheck: 55%
    PerformanceCheck --> CompetitorResearch: 70%
    CompetitorResearch --> ReportGeneration: 85%
    ReportGeneration --> Completed: 100%
    Completed --> [*]
```

## 🎯 Key Features

### Intelligent AI Analysis
- **Claude Code SDK Integration**: Leverages advanced AI for deep website analysis
- **MCP Tool Orchestration**: Coordinates multiple analysis tools for comprehensive insights
- **Tier-Specific Prompts**: Optimized prompts for each pricing tier's value proposition
- **Fallback Mechanisms**: Graceful degradation when tools are unavailable

### Business Features
- **Anonymous Checkout**: Users can purchase reports without creating an account
- **Real-time Progress**: Live updates during report generation
- **Automatic User Creation**: Creates user account post-payment for report access
- **Report Storage**: Permanent storage of generated reports in PostgreSQL

### Technical Excellence
- **Scalable Architecture**: Horizontal scaling with worker pools
- **Rate Limiting**: Intelligent rate limiting for external APIs
- **Error Recovery**: Comprehensive error handling with fallback analysis
- **Testing Coverage**: 85%+ test coverage with unit and integration tests

## 📈 Performance Metrics

- **Lite Reports**: Complete in < 3 minutes
- **Pro Reports**: Complete in < 6 minutes
- **Elite Reports**: Complete in < 12 minutes
- **Tasklist Pro**: Complete in < 10 minutes
- **Concurrent Processing**: 2 reports per worker
- **System Capacity**: 50+ reports per hour

## 🚀 Deployment

### Production Checklist

1. **Database Setup**
   - Configure production PostgreSQL
   - Run migrations: `pnpm db:migrate`
   - Set up connection pooling

2. **Redis Configuration**
   - Deploy Redis instance
   - Configure for persistence
   - Set up Redis Sentinel for HA

3. **Worker Deployment**
   - Deploy worker instances
   - Configure auto-scaling
   - Set up health monitoring

4. **Environment Variables**
   - Update all production keys
   - Set proper BASE_URL
   - Configure API rate limits

5. **Monitoring**
   - Set up error tracking (Sentry)
   - Configure performance monitoring
   - Set up alerts for failures

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 💬 Support

For support, email support@example.com or open an issue on GitHub.

---

Built with ❤️ using Next.js and Claude Code SDK