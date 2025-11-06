# Migration Plan: LangGraph → Vercel AI SDK
## Claude Agent for Website Audit Reports

**Date:** 2025-11-06
**Status:** Planning
**Migration Type:** Architecture Refactor

---

## 1. Why Migrate to Vercel AI SDK?

### Current Issues with LangGraph
- ❌ Over-engineered for sequential workflow
- ❌ LangGraph is overkill when we don't need complex DAG routing
- ❌ StateGraph adds complexity without adding value
- ❌ Harder to debug and maintain
- ❌ More dependencies and larger bundle size

### Benefits of Vercel AI SDK
- ✅ **Simpler agent pattern** - Tools + agent loop
- ✅ **Better streaming support** - Native streaming with `streamText`
- ✅ **Multi-provider support** - Easy to switch between Claude, GPT-4, etc.
- ✅ **Smaller footprint** - Less dependencies
- ✅ **Better TypeScript support** - First-class types
- ✅ **Active development** - Vercel actively maintains it
- ✅ **Built for Next.js** - Perfect integration with our stack

---

## 2. Architecture Comparison

### Current: LangGraph StateGraph

```typescript
// LangGraph approach
const graph = new StateGraph(ReportStateAnnotation)
  .addNode('crawlWebsite', crawlWebsite)
  .addNode('fetchSEOMetrics', fetchSEOMetrics)
  .addNode('performTechnicalAnalysis', performTechnicalAnalysis)
  .addConditionalEdges('route_next', getNextNode, {...})
  .compile();

// Execute
for await (const state of graph.stream(initialState)) {
  // Update progress
}
```

**Complexity:**
- Explicit node definitions
- Manual routing logic
- State annotations
- Checkpoint savers
- Edge configurations

### New: Vercel AI SDK Agent

```typescript
// Vercel AI SDK approach
const result = await streamText({
  model: anthropic('claude-3-5-sonnet-20241022'),
  system: `You are an expert SEO analyst. Use the provided tools to analyze ${domain}.`,
  messages,
  tools: {
    crawlWebsite: tool({
      description: 'Extract website content and structure',
      parameters: z.object({ url: z.string() }),
      execute: async ({ url }) => {
        // Analysis logic
      }
    }),
    fetchSEOMetrics: tool({
      description: 'Gather comprehensive SEO data',
      parameters: z.object({ domain: z.string() }),
      execute: async ({ domain }) => {
        // SEO analysis
      }
    }),
    // ... more tools
  },
  maxToolRoundtrips: 10,
  onStepFinish: ({ stepType, toolCalls, text }) => {
    // Update progress
  }
});

// Stream responses
for await (const chunk of result.textStream) {
  console.log(chunk);
}
```

**Simplicity:**
- Tools as functions
- Agent decides which tools to call
- Built-in streaming
- Simple progress tracking
- Natural conversation flow

---

## 3. Migration Strategy

### Phase 1: Setup Vercel AI SDK (30 minutes)

**Tasks:**
1. Install dependencies
   ```bash
   pnpm add ai @ai-sdk/anthropic zod
   pnpm remove @langchain/langgraph @langchain/core
   ```

2. Configure Anthropic provider
   ```typescript
   // lib/ai/client.ts
   import { anthropic } from '@ai-sdk/anthropic';
   export const model = anthropic('claude-3-5-sonnet-20241022');
   ```

### Phase 2: Convert Nodes to Tools (2 hours)

**Strategy:** Each LangGraph node → Vercel AI SDK tool

```typescript
// Before: LangGraph node
export async function crawlWebsite(state: ReportState): Promise<Partial<ReportState>> {
  const result = await aiQuery(...);
  return { websiteContent: result, progress: 30 };
}

// After: AI SDK tool
export const crawlWebsiteTool = tool({
  description: 'Extract website content, structure, and metadata for SEO analysis',
  parameters: z.object({
    url: z.string().url().describe('The website URL to analyze'),
    tier: z.enum(['lite', 'pro', 'elite', 'tasklist-pro']).describe('Analysis tier')
  }),
  execute: async ({ url, tier }) => {
    // Same logic, return data directly
    const result = await extractWebsiteContent(url, tier);
    return result;
  }
});
```

**Tools to Create:**
1. `crawlWebsiteTool` - Website content extraction
2. `fetchSEOMetricsTool` - SEO data collection
3. `captureScreenshotsTool` - Visual analysis (Pro+)
4. `analyzeCompetitorsTool` - Competitor research (Pro+)
5. `performTechnicalAnalysisTool` - Technical SEO audit
6. `performContentAnalysisTool` - Content strategy (Pro+)
7. `performStrategicAnalysisTool` - Strategic recommendations (Elite)
8. `performCompetitiveAnalysisTool` - Competitive intelligence (Elite)
9. `compileReportTool` - Final report generation

### Phase 3: Implement Agent Orchestrator (1 hour)

**File:** `lib/ai/report-agent.ts`

```typescript
import { streamText, tool } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import * as tools from './tools';

export async function generateReportWithAgent(
  domain: string,
  tier: 'lite' | 'pro' | 'elite' | 'tasklist-pro',
  reportId: string,
  progressCallback?: (progress: number, message: string) => Promise<void>
) {
  const tierInstructions = getTierInstructions(tier);

  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: `You are an expert SEO analyst generating a ${tier} tier website analysis report.

${tierInstructions}

IMPORTANT RULES:
1. Always start by calling crawlWebsiteTool to extract website content
2. Then call fetchSEOMetricsTool for SEO data
3. For Pro+ tiers, call captureScreenshotsTool and analyzeCompetitorsTool
4. Perform analysis using the appropriate analysis tools based on tier
5. Finally, call compileReportTool to generate the final report
6. Update progress after each major step

Current task: Analyze ${domain} and generate a comprehensive ${tier} tier report.`,

    messages: [
      {
        role: 'user',
        content: `Please analyze the website ${domain} and generate a ${tier} tier SEO report. Follow the step-by-step process.`
      }
    ],

    tools: {
      crawlWebsite: tools.crawlWebsiteTool,
      fetchSEOMetrics: tools.fetchSEOMetricsTool,
      captureScreenshots: tools.captureScreenshotsTool,
      analyzeCompetitors: tools.analyzeCompetitorsTool,
      performTechnicalAnalysis: tools.performTechnicalAnalysisTool,
      performContentAnalysis: tools.performContentAnalysisTool,
      performStrategicAnalysis: tools.performStrategicAnalysisTool,
      performCompetitiveAnalysis: tools.performCompetitiveAnalysisTool,
      compileReport: tools.compileReportTool,
      updateProgress: tool({
        description: 'Update report generation progress',
        parameters: z.object({
          progress: z.number().min(0).max(100),
          message: z.string()
        }),
        execute: async ({ progress, message }) => {
          await progressCallback?.(progress, message);
          return { success: true };
        }
      })
    },

    maxToolRoundtrips: 15, // Allow enough rounds for all tools
    temperature: 0.7,

    onStepFinish: async ({ stepType, toolCalls, text }) => {
      if (toolCalls) {
        for (const toolCall of toolCalls) {
          console.log(`[Agent] Called tool: ${toolCall.toolName}`);
        }
      }
    }
  });

  // Stream and collect results
  let finalText = '';
  for await (const chunk of result.textStream) {
    finalText += chunk;
  }

  // Extract final report from tool calls
  const toolResults = await result.toolResults;
  const compiledReport = toolResults.find(r => r.toolName === 'compileReport');

  return {
    report: compiledReport?.result,
    fullResponse: finalText,
    toolCalls: toolResults
  };
}
```

### Phase 4: Update Worker Integration (30 minutes)

**File:** `lib/workers/ai-sdk-worker.ts`

```typescript
import { Job } from 'bullmq';
import { generateReportWithAgent } from '../ai/report-agent';

export async function processReportWithAISDK(job: Job<ReportJobData>): Promise<any> {
  const { domain, reportTier, reportId } = job.data;

  // Create progress callback
  const progressCallback = async (progress: number, message: string) => {
    await job.updateProgress(progress);
    await db.update(reportJobs).set({
      progress,
      progressMessage: message,
      updatedAt: new Date()
    }).where(eq(reportJobs.reportId, reportId));
  };

  try {
    const { report } = await generateReportWithAgent(
      domain,
      reportTier as ReportTier,
      reportId.toString(),
      progressCallback
    );

    // Update database
    await db.update(reports).set({
      status: 'completed',
      reportData: JSON.stringify(report),
      completedAt: new Date()
    }).where(eq(reports.id, reportId));

    return report;
  } catch (error) {
    console.error('[AI SDK Worker] Error:', error);
    throw error;
  }
}
```

### Phase 5: Testing & Validation (1 hour)

**Test Cases:**
1. Lite tier report generation
2. Pro tier with screenshots and competitors
3. Elite tier with strategic analysis
4. Progress tracking accuracy
5. Error handling and fallbacks
6. Streaming performance

---

## 4. Tier-Specific System Prompts

### Lite Tier (€29)
```typescript
const LITE_INSTRUCTIONS = `
You are generating a LITE tier report (€29 - Basic SEO Fundamentals).

TOOLS YOU MUST USE IN ORDER:
1. crawlWebsite - Extract basic website content
2. fetchSEOMetrics - Get basic SEO data
3. performTechnicalAnalysis - Basic technical audit
4. compileReport - Generate final report with 3-5 quick wins

FOCUS AREAS:
- Meta tags and basic on-page SEO
- Content structure and readability
- Quick wins (low-effort, high-impact)
- Mobile responsiveness basics

SKIP: Screenshots, competitors, advanced analysis
TARGET: Complete in under 3 minutes
`;
```

### Pro Tier (€69)
```typescript
const PRO_INSTRUCTIONS = `
You are generating a PRO tier report (€69 - Advanced Analysis).

TOOLS YOU MUST USE IN ORDER:
1. crawlWebsite - Comprehensive content extraction
2. fetchSEOMetrics - Detailed SEO metrics
3. captureScreenshots - Visual UX analysis
4. analyzeCompetitors - Competitor research (top 3)
5. performTechnicalAnalysis - Advanced technical audit
6. performContentAnalysis - Content strategy analysis
7. compileReport - Generate detailed report with roadmap

FOCUS AREAS:
- Advanced technical SEO (Core Web Vitals, schema markup)
- Competitive keyword gap analysis
- UX/CRO recommendations from visual analysis
- Content cluster opportunities

TARGET: Complete in under 6 minutes
`;
```

### Elite Tier (€149)
```typescript
const ELITE_INSTRUCTIONS = `
You are generating an ELITE tier report (€149 - Enterprise Strategic Analysis).

TOOLS YOU MUST USE IN ORDER:
1. crawlWebsite - Deep content analysis
2. fetchSEOMetrics - Comprehensive metrics
3. captureScreenshots - Detailed visual analysis
4. analyzeCompetitors - Market research (top 5 competitors)
5. performTechnicalAnalysis - Enterprise technical audit
6. performContentAnalysis - Strategic content planning
7. performStrategicAnalysis - Business strategy and ROI projections
8. performCompetitiveAnalysis - Competitive intelligence
9. compileReport - Generate executive report with multi-phase roadmap

FOCUS AREAS:
- Strategic market positioning
- ROI projections and business case
- Multi-phase implementation roadmap (6-12 months)
- Competitive advantage development
- Executive-level insights

TARGET: Complete in under 12 minutes
`;
```

### Tasklist Pro Tier (€299)
```typescript
const TASKLIST_PRO_INSTRUCTIONS = `
You are generating a TASKLIST PRO tier report (€299 - Executive + Actionable Tasks).

[Same tools as Elite, plus:]
10. generateTasklist - Create prioritized task list with ROI

FOCUS AREAS:
- All Elite tier analysis
- 20+ prioritized actionable tasks
- ROI calculations per task
- Resource planning and timelines
- Export formats (Asana, Notion, CSV)

OUTPUT: Executive summary + comprehensive task list
TARGET: Complete in under 10 minutes
`;
```

---

## 5. Implementation Checklist

### Preparation
- [ ] Read Vercel AI SDK docs (https://sdk.vercel.ai/docs)
- [ ] Review tool calling examples
- [ ] Understand streaming patterns
- [ ] Check Anthropic provider setup

### Code Changes
- [ ] Install `ai` and `@ai-sdk/anthropic`
- [ ] Create `lib/ai/` directory structure
- [ ] Implement tools in `lib/ai/tools/`
- [ ] Create agent orchestrator in `lib/ai/report-agent.ts`
- [ ] Update worker in `lib/workers/ai-sdk-worker.ts`
- [ ] Update main worker to use new system

### Testing
- [ ] Unit tests for each tool
- [ ] Integration test for agent flow
- [ ] Test progress tracking
- [ ] Test error handling
- [ ] Performance benchmarks (compare to LangGraph)

### Cleanup
- [ ] Remove LangGraph dependencies
- [ ] Delete `lib/langgraph/` directory
- [ ] Update documentation
- [ ] Remove old tests
- [ ] Update CLAUDE.md with new architecture

### Deployment
- [ ] Test in staging environment
- [ ] Verify all tiers work correctly
- [ ] Monitor performance and costs
- [ ] Update environment variables if needed

---

## 6. Expected Improvements

### Performance
- **Faster execution** - No StateGraph overhead
- **Better streaming** - Native AI SDK streaming is smoother
- **Simpler debugging** - Tool calls are easier to trace

### Code Quality
- **Less complexity** - ~40% less code
- **Better types** - Zod schemas for all tool parameters
- **Easier maintenance** - Single agent file vs. complex graph

### Developer Experience
- **Simpler mental model** - Tools + agent vs. nodes + edges
- **Better error messages** - AI SDK has clear error handling
- **Easier to extend** - Just add new tools

### Cost
- **Same API costs** - Still using Claude
- **Potentially faster** - Less overhead = fewer tokens
- **Better control** - Explicit tool parameters reduce wasted calls

---

## 7. File Structure (After Migration)

```
lib/
├── ai/
│   ├── client.ts                    # Anthropic client setup
│   ├── report-agent.ts              # Main agent orchestrator
│   ├── tier-prompts.ts              # Tier-specific instructions
│   └── tools/
│       ├── index.ts                 # Tool exports
│       ├── data-collection.ts       # Website crawling, SEO metrics
│       ├── analysis.ts              # Technical, content, strategic analysis
│       ├── competitors.ts           # Competitor research
│       └── compilation.ts           # Report compilation
├── mcp/
│   ├── client.ts                    # MCP client (keep for real tools)
│   └── config.ts                    # Tool configurations
├── prompts/
│   ├── lite-analysis.ts             # Keep - used in tool execution
│   ├── pro-analysis.ts
│   ├── elite-analysis.ts
│   └── tasklist-analysis.ts
├── workers/
│   ├── report-worker.ts             # Main worker (update to use AI SDK)
│   └── ai-sdk-worker.ts             # New AI SDK worker
└── queue/
    └── report-queue.ts              # No changes needed

REMOVED:
lib/langgraph/                       # Delete entire directory
lib/workers/langgraph-worker.ts      # Delete
tests/langgraph/                     # Delete
```

---

## 8. Migration Timeline

**Total Estimated Time: 5-6 hours**

| Phase | Duration | Status |
|-------|----------|--------|
| Planning & Documentation | 30 min | ✅ Done |
| Install Dependencies | 15 min | ⏳ Pending |
| Create Tool Infrastructure | 1.5 hours | ⏳ Pending |
| Implement Agent Orchestrator | 1 hour | ⏳ Pending |
| Update Worker Integration | 30 min | ⏳ Pending |
| Testing & Debugging | 1.5 hours | ⏳ Pending |
| Cleanup & Documentation | 30 min | ⏳ Pending |

---

## 9. Risk Mitigation

### Risks
1. **Agent doesn't follow tool sequence** - Claude might skip tools
   - *Mitigation:* Strong system prompts with explicit instructions

2. **Streaming complexity** - Progress tracking might be harder
   - *Mitigation:* Use `onStepFinish` callback for progress

3. **Tool calling limits** - Max 15 roundtrips might not be enough
   - *Mitigation:* Monitor and increase if needed

4. **Cost increase** - Agent might make redundant tool calls
   - *Mitigation:* Monitor token usage, optimize prompts

### Rollback Plan
- Keep LangGraph code in separate branch
- Feature flag to switch between implementations
- Easy to revert if issues arise

---

## 10. Success Metrics

### Must Have
- ✅ All 4 tiers generate valid reports
- ✅ Execution time within targets (3/6/12/10 min)
- ✅ Progress tracking works correctly
- ✅ Error handling maintains reliability

### Nice to Have
- 🎯 10-20% faster than LangGraph
- 🎯 Cleaner error messages
- 🎯 Easier to add new analysis types
- 🎯 Better debugging experience

---

## Next Steps

1. **Review this plan** ✅ Done
2. **Get approval** ⏳ Waiting
3. **Start implementation** ⏳ Ready to begin
4. **Iterative testing** ⏳ Pending
5. **Deploy to production** ⏳ Final step

---

**Questions? Ready to proceed with implementation?**
