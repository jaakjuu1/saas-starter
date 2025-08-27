@echo off
REM AI Website Growth Report SaaS - Windows Runner
REM Easy commands for Windows users without Make

echo AI Website Growth Report SaaS - Windows Commands
echo ==================================================
echo.

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="up" goto up
if "%1"=="down" goto down
if "%1"=="logs" goto logs
if "%1"=="dev" goto dev
if "%1"=="worker" goto worker
if "%1"=="setup" goto setup
if "%1"=="clean" goto clean

:help
echo Available Commands:
echo.
echo   run setup    - First time setup (install deps, create .env)
echo   run up       - Start all services with Docker
echo   run down     - Stop all services
echo   run logs     - Show logs from all services
echo   run dev      - Start development (Next.js only)
echo   run worker   - Start worker process only
echo   run clean    - Clean build artifacts
echo.
echo Quick Start:
echo   1. run setup
echo   2. run up
echo   3. Open http://localhost:3000
goto end

:setup
echo Installing dependencies...
call pnpm install
echo.
echo Copying .env.example to .env if not exists...
if not exist .env copy .env.example .env
echo.
echo Running database migrations...
call pnpm db:migrate
echo.
echo Setup complete! Run 'run up' to start all services
goto end

:up
echo Starting all services with Docker Compose...
docker-compose up -d
echo.
echo Services started!
echo Web app: http://localhost:3000
echo Bull Dashboard: http://localhost:3001
echo Redis: localhost:6379
echo PostgreSQL: localhost:5432
goto end

:down
echo Stopping all services...
docker-compose down
goto end

:logs
docker-compose logs -f
goto end

:dev
echo Starting Redis and PostgreSQL in Docker...
docker-compose up -d redis postgres
timeout /t 3 /nobreak > nul
echo Starting Next.js development server...
call pnpm dev
goto end

:worker
echo Starting worker process...
call pnpm run worker
goto end

:clean
echo Cleaning build artifacts...
rmdir /s /q .next 2>nul
rmdir /s /q node_modules 2>nul
docker-compose down -v
goto end

:end