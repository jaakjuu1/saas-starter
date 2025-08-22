/**
 * Jest Test Setup
 * Configures test environment, mocks, and global test utilities
 */

import { config } from 'dotenv';
import path from 'path';

// Load test environment variables
config({ path: path.resolve(process.cwd(), '.env.test') });

// Mock Claude Code SDK for testing
jest.mock('@anthropic-ai/claude-code', () => ({
  query: jest.fn(),
}));

// Mock Redis for testing
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    status: 'ready',
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
  }));
});

// Mock database for testing
jest.mock('@/lib/db/drizzle', () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  },
}));

// Global test utilities
global.testUtils = {
  // Test domain collection
  TEST_DOMAINS: {
    simple: 'https://example.com',
    ecommerce: 'https://demo-store.shopify.com',
    saas: 'https://www.anthropic.com',
    corporate: 'https://www.microsoft.com',
    blog: 'https://techcrunch.com',
  },

  // Mock analysis responses
  MOCK_ANALYSIS_RESPONSES: {
    lite: {
      structure: 'Clean website structure with good navigation',
      content_quality: 'Well-organized content with clear messaging',
      accessibility: 'Basic accessibility features present',
      mobile_responsive: 'Responsive design implemented',
      score: 78,
    },
    pro: {
      technical_seo: { score: 82 },
      visual_analysis: { ux_score: 75 },
      competitive_analysis: { score: 70 },
      content_strategy: { score: 80 },
    },
    elite: {
      strategic_overview: { market_position: 'Strong competitive position' },
      enterprise_technical_seo: { score: 85 },
      competitive_intelligence: { score: 78 },
    },
    tasklist_pro: {
      executive_dashboard: { strategic_summary: 'Executive analysis complete' },
      actionable_tasks: { critical_tasks: [], high_priority_tasks: [] },
    },
  },

  // Error simulation utilities
  createMockError: (type: string, message: string) => {
    const error = new Error(message);
    error.name = type;
    return error;
  },

  // Progress tracking mock
  createProgressMock: () => {
    const calls: Array<{ progress: number; message: string; stage: string }> = [];
    return {
      callback: jest.fn((progress, message, stage) => {
        calls.push({ progress, message, stage });
        return Promise.resolve();
      }),
      getCalls: () => calls,
      getLastCall: () => calls[calls.length - 1],
    };
  },

  // Rate limit simulation
  simulateRateLimit: () => {
    const error = new Error('Rate limit exceeded');
    error.name = 'RateLimitError';
    return error;
  },

  // Wait utility for async testing
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};

// Console output suppression for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress console output during tests unless explicitly enabled
  if (!process.env.VERBOSE_TESTS) {
    console.error = jest.fn();
    console.warn = jest.fn();
  }
});

afterAll(() => {
  // Restore console output
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Clear all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Test timeout configuration
jest.setTimeout(30000);

// Declare global types for TypeScript
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        TEST_DOMAINS: Record<string, string>;
        MOCK_ANALYSIS_RESPONSES: Record<string, any>;
        createMockError: (type: string, message: string) => Error;
        createProgressMock: () => {
          callback: jest.Mock;
          getCalls: () => Array<{ progress: number; message: string; stage: string }>;
          getLastCall: () => { progress: number; message: string; stage: string };
        };
        simulateRateLimit: () => Error;
        wait: (ms: number) => Promise<void>;
      };
    }
  }
}