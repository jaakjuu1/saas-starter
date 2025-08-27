# Repository Guidelines

## Project Structure & Modules
- `app/`: Next.js App Router UI and `app/api/*` routes.
- `lib/`: Core logic
  - `db/` (Drizzle ORM config, schema, setup/migrations helpers)
  - `queue/` (BullMQ queues), `workers/` (report worker)
  - `mcp/` (Model Context Protocol clients/servers integration)
  - `auth/`, `payments/`, `prompts/`, `utils.ts`
- `workers/start-worker.ts`: Entrypoint for the background worker.
- `components/`: Reusable React components.
- `tests/`: Jest setup and suites.
- Tooling/config: `Makefile`, `jest.config.js`, `drizzle.config.ts`, `docker-compose*.yml`, `.env*`.

## Build, Test, and Development
- Install deps: `pnpm install` (or `make setup` to also create `.env` and migrate DB).
- Local dev (non‑Docker): `make dev` (runs web + worker) or `pnpm dev` and `pnpm run worker` in parallel.
- Docker dev: `make up` to start web, worker, Redis, Postgres; `make logs`, `make down`.
- Build/start: `pnpm build` then `pnpm start`.
- Database: `pnpm db:migrate`, `pnpm db:seed`. Start services only: `make dev-services`.
- Stripe webhooks: `make stripe-listen`.

## Coding Style & Naming
- Language: TypeScript + Next.js 15, Tailwind CSS 4.
- Filenames: kebab-case for files/dirs (`report-worker.ts`), PascalCase for React components, camelCase for variables/functions.
- Keep modules focused under `lib/*`; place API handlers under `app/api/*`.
- No repo-wide linter config is committed; use consistent 2‑space indentation and run your editor’s formatter.

## Testing Guidelines
- Framework: Jest via `ts-jest` (Node env).
- Test locations: `tests/**/*.test.ts|*.spec.ts`; setup at `tests/setup.ts`.
- Coverage: enforced (branches 80%; lines/functions/statements 85%). Check with `pnpm test:coverage`.
- Commands: `pnpm test`, `pnpm test:unit`, `pnpm test:e2e`, or `make test`.

## Commit & Pull Request Guidelines
- Use Conventional Commits (e.g., `feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`). Keep commits small and scoped.
- PRs include: clear description (what/why), linked issues, screenshots for UI, and a test plan. Ensure tests pass and coverage holds.

## Security & Config Tips
- Copy `.env.example` to `.env`; never commit secrets. Common vars: Postgres URL, `REDIS_URL`, Stripe keys.
- Start required services locally with `make dev-services` or full stack with `make up`.
- MCP tooling lives in `lib/mcp/`; for quick checks, see `mcp-health-check.js` and `test-*.js` scripts in the repo root.
