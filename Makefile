# AI Website Growth Report SaaS - Makefile
# Orchestrates all services and development workflows

.PHONY: help up down start stop restart logs dev worker test clean setup db-migrate stripe-listen

# Default target - show help
help:
	@echo "AI Website Growth Report SaaS - Development Commands"
	@echo "======================================================"
	@echo ""
	@echo "🚀 Quick Start:"
	@echo "  make setup          - First time setup (install deps, create .env, migrate DB)"
	@echo "  make up             - Start all services with Docker Compose"
	@echo "  make dev            - Start development environment (non-Docker)"
	@echo ""
	@echo "🐳 Docker Commands:"
	@echo "  make up             - Start all services in Docker"
	@echo "  make down           - Stop and remove all containers"
	@echo "  make restart        - Restart all services"
	@echo "  make logs           - Show logs from all services"
	@echo "  make logs-worker    - Show worker logs only"
	@echo "  make logs-web       - Show web app logs only"
	@echo ""
	@echo "💻 Development (Non-Docker):"
	@echo "  make dev            - Run Next.js + Worker locally"
	@echo "  make dev-web        - Run only Next.js app"
	@echo "  make dev-worker     - Run only worker process"
	@echo "  make dev-redis      - Start Redis in Docker"
	@echo "  make dev-postgres   - Start PostgreSQL in Docker"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test           - Run all tests"
	@echo "  make test-unit      - Run unit tests"
	@echo "  make test-e2e       - Run E2E tests"
	@echo "  make test-worker    - Test worker integration"
	@echo ""
	@echo "🗄️ Database:"
	@echo "  make db-migrate     - Run database migrations"
	@echo "  make db-seed        - Seed database with test data"
	@echo "  make db-reset       - Reset database (CAUTION!)"
	@echo ""
	@echo "💳 Stripe:"
	@echo "  make stripe-listen  - Start Stripe webhook listener"
	@echo ""
	@echo "🧹 Maintenance:"
	@echo "  make clean          - Clean build artifacts and cache"
	@echo "  make setup          - Initial project setup"

# === SETUP ===
setup:
	@echo "📦 Installing dependencies..."
	pnpm install
	@echo "📝 Creating .env file if not exists..."
	@if [ ! -f .env ]; then cp .env.example .env && echo "✅ Created .env file - please update with your API keys"; else echo "✅ .env file already exists"; fi
	@echo "🗄️ Running database migrations..."
	make db-migrate
	@echo "✅ Setup complete! Run 'make up' to start all services"

# === DOCKER COMPOSE COMMANDS ===
up:
	@echo "🚀 Starting all services with Docker Compose..."
	docker-compose up -d
	@echo "✅ Services started!"
	@echo "📍 Web app: http://localhost:3000"
	@echo "📍 Bull Dashboard: http://localhost:3001"
	@echo "📍 Redis: localhost:6379"
	@echo "📍 PostgreSQL: localhost:5432"

down:
	@echo "🛑 Stopping all services..."
	docker-compose down

stop:
	@echo "⏸️ Stopping all services (keeping containers)..."
	docker-compose stop

start:
	@echo "▶️ Starting stopped services..."
	docker-compose start

restart:
	@echo "🔄 Restarting all services..."
	docker-compose restart

logs:
	docker-compose logs -f

logs-worker:
	docker-compose logs -f worker

logs-web:
	docker-compose logs -f web

logs-redis:
	docker-compose logs -f redis

# === LOCAL DEVELOPMENT (Non-Docker) ===
dev: dev-services
	@echo "🚀 Starting development environment..."
	@trap 'make dev-stop' INT; \
	make -j2 dev-web dev-worker

dev-services:
	@echo "🐳 Starting Redis and PostgreSQL in Docker..."
	docker-compose up -d redis postgres
	@echo "⏳ Waiting for services to be ready..."
	@sleep 3

dev-stop:
	@echo "🛑 Stopping development services..."
	docker-compose stop redis postgres

dev-web:
	@echo "🌐 Starting Next.js development server..."
	pnpm dev

dev-worker:
	@echo "⚙️ Starting worker process..."
	pnpm run worker

dev-redis:
	@echo "🗄️ Starting Redis only..."
	docker-compose up -d redis

dev-postgres:
	@echo "🗄️ Starting PostgreSQL only..."
	docker-compose up -d postgres

# === DATABASE ===
db-migrate:
	@echo "🗄️ Running database migrations..."
	pnpm db:migrate

db-seed:
	@echo "🌱 Seeding database..."
	pnpm db:seed

db-reset:
	@echo "⚠️ Resetting database - this will delete all data!"
	@read -p "Are you sure? (y/N) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		pnpm db:reset; \
	fi

# === TESTING ===
test:
	@echo "🧪 Running all tests..."
	pnpm test

test-unit:
	@echo "🧪 Running unit tests..."
	pnpm test:unit

test-e2e:
	@echo "🧪 Running E2E tests..."
	pnpm test:e2e

test-worker:
	@echo "🧪 Testing worker integration..."
	npx tsx test-worker-integration.js

test-lite:
	@echo "🧪 Testing Lite report generation..."
	npx tsx test-worker-lite.js

# === STRIPE ===
stripe-listen:
	@echo "💳 Starting Stripe webhook listener..."
	stripe listen --forward-to localhost:3000/api/stripe/webhook

# === MAINTENANCE ===
clean:
	@echo "🧹 Cleaning build artifacts and cache..."
	rm -rf .next node_modules dist
	docker-compose down -v

build:
	@echo "🏗️ Building application..."
	pnpm build

# === MONITORING ===
monitor:
	@echo "📊 Opening monitoring dashboards..."
	@echo "Bull Dashboard: http://localhost:3001"
	@open http://localhost:3001 2>/dev/null || xdg-open http://localhost:3001 2>/dev/null || echo "Please open http://localhost:3001"

# === PRODUCTION SIMULATION ===
prod:
	@echo "🚀 Starting production simulation..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up

prod-build:
	@echo "🏗️ Building production images..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build