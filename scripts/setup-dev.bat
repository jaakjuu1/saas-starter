@echo off
REM LangGraph Development Setup for Windows
REM This batch script sets up the development environment

echo.
echo =================================================
echo   LangGraph Development Environment Setup
echo =================================================
echo.

REM Check if pnpm is available
pnpm --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: pnpm is not installed or not in PATH
    echo Please install pnpm: npm install -g pnpm
    pause
    exit /b 1
)

REM Check if Docker is available
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker is not installed or not running
    echo Please install Docker Desktop and start it
    pause
    exit /b 1
)

echo ✅ pnpm and Docker are available

REM Start database services
echo.
echo 📦 Starting database services (PostgreSQL + Redis)...
docker-compose up -d postgres redis

REM Wait for services to be ready
echo ⏳ Waiting for services to initialize...
timeout /t 5 /nobreak >nul

REM Run the JavaScript setup checker
echo.
echo 🔍 Running environment checks...
npx tsx scripts/setup-langgraph-dev.js

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ Setup checks failed. Please fix the issues above.
    pause
    exit /b 1
)

echo.
echo ✅ Development environment is ready!
echo.
echo 📋 Available commands:
echo   pnpm dev          - Start Next.js development server
echo   pnpm run worker   - Start report worker process
echo   pnpm test         - Run all tests
echo.
echo 🧪 LangGraph testing:
echo   npx tsx test-worker-integration.js  - Test worker integration
echo   npx tsx test-worker-lite.js         - Test Lite report generation
echo   npx tsx test-system-health.js       - System health check
echo.
echo Press any key to continue...
pause >nul