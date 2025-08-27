# 🚀 Deployment & Development Guide

## Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# First time setup
make setup

# Start all services
make up

# Check logs
make logs
```

### Option 2: Windows Users (without Make)

```cmd
# First time setup
run setup

# Start all services
run up

# Check logs
run logs
```

### Option 3: Local Development (Mixed Mode)

```bash
# Start only Redis and PostgreSQL in Docker
docker-compose up -d redis postgres

# Terminal 1: Start Next.js
pnpm dev

# Terminal 2: Start Worker
pnpm run worker

# Terminal 3 (optional): Stripe webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## 📋 System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│     Redis       │◀────│     Worker      │
│   (Port 3000)   │     │   (Port 6379)   │     │   (BullMQ)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                                │
         └──────────────────┬────────────────────────────┘
                            ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   (Port 5432)   │
                    └─────────────────┘
```

## 🐳 Docker Services

### Services Overview

| Service | Port | Description |
|---------|------|-------------|
| `postgres` | 5432 | PostgreSQL database |
| `redis` | 6379 | Redis for job queue |
| `web` | 3000 | Next.js application |
| `worker` | - | Report generation worker |
| `bull-board` | 3001 | Queue monitoring dashboard |

### Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Required variables:
- `ANTHROPIC_API_KEY` - For AI analysis
- `STRIPE_SECRET_KEY` - For payments
- `STRIPE_WEBHOOK_SECRET` - For Stripe webhooks
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - For Stripe frontend

Optional:
- `FIRECRAWL_API_KEY` - For web scraping
- `DATAFOR_SEO_LOGIN/PASSWORD` - For SEO data

## 🛠️ Development Workflow

### Full Stack Development

```bash
# Using Make (Linux/Mac)
make dev

# Using Docker Compose
docker-compose up

# Manual setup
docker-compose up -d redis postgres
pnpm dev         # Terminal 1
pnpm run worker  # Terminal 2
```

### Database Management

```bash
# Run migrations
make db-migrate
# or
pnpm db:migrate

# Reset database (CAUTION!)
make db-reset
# or
pnpm db:reset
```

### Testing

```bash
# Run all tests
make test

# Test worker specifically
make test-worker

# Test report generation
npx tsx test-worker-lite.js
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Redis Connection Error
**Problem**: "Redis connection failed" or "ECONNREFUSED"

**Solution**:
```bash
# Check if Redis is running
docker ps | grep redis

# If not running, start it
docker-compose up -d redis

# Check Redis connectivity
docker exec -it saas_seo_redis redis-cli ping
```

#### 2. Worker Not Processing Jobs
**Problem**: Jobs stuck in "pending" or "stalled"

**Solution**:
```bash
# Check worker logs
docker-compose logs worker

# Restart worker
docker-compose restart worker

# Check Bull Dashboard
open http://localhost:3001
```

#### 3. Database Connection Issues
**Problem**: "Cannot connect to PostgreSQL"

**Solution**:
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker-compose logs postgres

# Recreate database
docker-compose down postgres
docker-compose up -d postgres
make db-migrate
```

#### 4. Port Already in Use
**Problem**: "Port 3000/6379/5432 already in use"

**Solution**:
```bash
# Find process using port (example for port 3000)
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000

# Kill the process or change port in docker-compose.yml
```

## 📊 Monitoring

### Bull Dashboard
Access queue monitoring at: http://localhost:3001

Features:
- View job queues
- Monitor job progress
- Retry failed jobs
- View job details

### Application Logs

```bash
# All services
make logs

# Specific service
docker-compose logs -f worker
docker-compose logs -f web
docker-compose logs -f redis
```

## 🚢 Production Deployment

### Using Docker

1. Build production images:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
```

2. Deploy to your server:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Environment Setup

Production requires:
- SSL certificates (use reverse proxy like Nginx)
- Domain configuration
- Production database (consider managed PostgreSQL)
- Redis cluster for high availability
- Monitoring (Sentry, Datadog, etc.)

### Scaling

For high traffic:
1. Scale workers horizontally:
```yaml
worker:
  deploy:
    replicas: 3
```

2. Use Redis Cluster for queue distribution
3. Implement database read replicas
4. Use CDN for static assets

## 🔐 Security Checklist

- [ ] All API keys in environment variables
- [ ] Database credentials secured
- [ ] Redis password configured (production)
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection headers

## 📝 Maintenance

### Daily Tasks
- Check error logs
- Monitor queue depth
- Review failed jobs

### Weekly Tasks
- Database backups
- Performance metrics review
- Security updates

### Commands Reference

```bash
# Health check
curl http://localhost:3000/api/health

# Queue status
curl http://localhost:3000/api/queue/status

# Manual job retry
curl -X POST http://localhost:3000/api/jobs/retry/{jobId}
```

## 🆘 Support

For issues:
1. Check logs: `make logs`
2. Review this guide
3. Check Bull Dashboard: http://localhost:3001
4. Create GitHub issue with:
   - Error messages
   - Steps to reproduce
   - Environment details