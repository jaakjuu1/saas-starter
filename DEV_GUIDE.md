# Agent & MCP Developer Guide

This guide orients new contributors working on the report-generating agent, MCP servers, and tool clients. For a system overview, see ARCHITECTURE.md.

## Quick Start
- Install: `pnpm install`
- Env: copy `.env.example` → `.env` and set:
  - `POSTGRES_URL`, `REDIS_URL`
  - `ANTHROPIC_API_KEY`
  - `FIRECRAWL_API_KEY`, `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`
- Services (Redis/Postgres): `make dev-services` (Docker)
- Health check: `node mcp-health-check.js`
- Run web + worker: `make dev` (or `pnpm dev` and `pnpm run worker`)
- Worker logs: `make logs-worker` (Docker) or console output (non-Docker)

## Core Flow (Agentic Pipeline)
- Queue: `lib/queue/report-queue.ts` adds `report-generation` jobs; API enqueues via `app/api/reports/checkout/success/route.ts`.
- Worker: `lib/workers/report-worker.ts` sets status, streams progress, calls `AnalysisEngine.analyzeWebsite` and saves `reportData`.
- Engine: `lib/mcp/analysis-engine.ts` selects tier prompts (`lib/prompts/*`), initializes Claude wrapper, formats `EnhancedAnalysisResult`.
- Claude + Tools: `lib/mcp/claude-mcp-wrapper.ts` starts MCP servers from `.mcp.json` via `lib/mcp/server-manager.ts`, gathers tool data (Firecrawl/Playwright/DataForSEO), builds a tool-data summary, and calls Claude (`claude-3-5-sonnet-20241022`).
- Status API: `GET /api/reports/[id]/status` returns job state and final JSON.

## Claude Code SDK’s Role
- Why it matters: Claude Code SDK is the backbone for tool-augmented analysis. It standardizes how agents invoke tools via MCP and aligns prompts, progress, and safety patterns used by the worker.
- In code: `lib/mcp/claude-mcp-wrapper.ts` uses `@anthropic-ai/sdk` to call Claude 3.5 and feeds it real data collected from MCP servers started per `.mcp.json`. The SDK’s MCP model informs our `McpServerManager`, `McpClient`, and tool clients in `lib/mcp/tools/*`.
- Developer workflow: Keep the SDK installed (`@anthropic-ai/claude-code`) so local CLI/debug flows are available. You can validate environment and MCP setup with `node mcp-health-check.js`, then run the worker (`pnpm run worker`) to exercise the full Claude + MCP loop.
- Mental model: Tools (Firecrawl/Playwright/DataForSEO) gather signals; Claude Code SDK context and prompts turn those signals into ranked findings and actionable recommendations. If tools fail, the engine degrades gracefully and still returns structured output.

## MCP Servers & Config
- Config file: `.mcp.json`
  - Example:
    ```json
    {
      "mcpServers": {
        "firecrawl": { "command": "node", "args": ["node_modules/firecrawl-mcp/dist/index.js"], "env": { "FIRECRAWL_API_KEY": "${FIRECRAWL_API_KEY}" } },
        "playwright": { "command": "node", "args": ["node_modules/@playwright/mcp/cli.js"], "env": {} },
        "dataforseo": { "command": "node", "args": ["node_modules/dataforseo-mcp-server/build/main/main/index.js"], "env": { "DATAFORSEO_LOGIN": "${DATAFORSEO_LOGIN}", "DATAFORSEO_PASSWORD": "${DATAFORSEO_PASSWORD}" } }
      }
    }
    ```
- Tier routing: `lib/mcp/config-loader.ts#getMcpServersForTier` maps tiers → required servers.
- Transport: `lib/mcp/transport/stdio-transport.ts` spawns servers via stdio; logs stderr; JSON-RPC on stdout.

## Tool Clients (where to add logic)
- Firecrawl: `lib/mcp/tools/firecrawl-client.ts` (scrape/map/search/extract, `scrapeForSEO` returns title/desc/headings/links).
- Playwright: `lib/mcp/tools/playwright-client.ts` (navigate, screenshot, a11y snapshot, perf metrics, UX analysis).
- DataForSEO: `lib/mcp/tools/dataforseo-client.ts` (SERP/keywords/backlinks/on-page/competitors, `getTechnicalAudit`).
- Generic client: `lib/mcp/mcp-client.ts` (tool discovery, `tools/call` with retries, JSON parsing helpers).

## Extending the Agent
- New tool/server:
  - Add server to `.mcp.json` (command/args/env). Optionally add a client in `lib/mcp/tools/<name>-client.ts` using `McpClient`.
  - Update `getMcpServersForTier` to include the server for tiers.
  - In `claude-mcp-wrapper.ts#analyzeWebsite`, initialize the client when running and incorporate its data into the `context` and tool-data summary.
- New tier or prompt changes:
  - Edit/add prompts in `lib/prompts/*` and map in `analysis-engine.ts#getTierPrompt`.
  - Adjust `formatReportForTier` to enrich tier output; keep `EnhancedAnalysisResult` stable.
- Parsing/Extraction:
  - If Claude output format changes, update `extractRecommendations`, `extractScore`, `extractIssues` in `claude-mcp-wrapper.ts`.

## Running & Debugging
- Local run:
  - Minimal: `make dev-services` → `pnpm run worker` (worker) and `pnpm dev` (web).
  - Full Docker: `make up` → `make logs-worker` / `make logs-web`.
- Connectivity:
  - Quick check: `node mcp-health-check.js`
  - Integration smoke: `npx tsx test-mcp-infrastructure.js` or `npx tsx test-worker-integration.js` (requires DB/Redis/API keys).
- Common issues:
  - Missing env → health check flags variables.
  - MCP not starting → verify `.mcp.json` command paths and node_modules installed.
  - Tool call not found → ensure server exposes the tool name (see `mcp-client.listTools()`).
  - Claude errors → validate `ANTHROPIC_API_KEY` and reduce `max_tokens` or temperature.

## Queue & Performance
- Concurrency/limits: `lib/workers/report-worker.ts` sets `concurrency: 2`, limiter `max 10/min` and lock durations suited for long analyses.
- Avoid duplicates: use unique job IDs (`report-${reportId}`) and consider a DB unique index on `reports.stripePaymentId`.
- Cost control: keep Lite tier minimal (Firecrawl only), reuse cached tool outputs by domain (add a TTL cache layer if needed).

## Testing Strategy
- Unit: mock `Claude` and MCP clients; test extraction utilities and tier formatting.
- Integration (opt-in): run worker with test DB/Redis and stub MCP/Claude using local wrappers.
- Commands: `pnpm test`, `pnpm test:unit`, `pnpm test:e2e`, or `make test`.

## Security & Logging
- Never commit secrets; use `.env`. Sanitize domains. Avoid logging scraped PII.
- Trace with `reportId` across logs. Consider structured logs (JSON) and a health endpoint to expose MCP status and queue depth.

## Helpful Paths
- Worker: `workers/start-worker.ts`, `lib/workers/report-worker.ts`
- Engine: `lib/mcp/analysis-engine.ts`, `lib/mcp/claude-mcp-wrapper.ts`
- Tools: `lib/mcp/tools/*`
- Config: `.mcp.json`, `lib/mcp/config-loader.ts`
- API: `app/api/reports/*`
- Queue: `lib/queue/report-queue.ts`
