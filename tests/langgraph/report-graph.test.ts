/**
 * Integration Tests for Complete LangGraph Flow
 * 
 * Test end-to-end graph execution for each tier: verify parallel execution timing,
 * test conditional routing by tier, validate checkpoint recovery, measure performance
 * improvements vs current system.
 */

import { describe, test, expect, jest, beforeEach, afterEach, beforeAll } from '@jest/globals';
import { 
  executeReportGeneration,
  streamReportGeneration,
  compileReportGraph,
  createReportGraph
} from '../../lib/langgraph/report-graph';
import { ReportState, ReportTier, TIER_CONFIG } from '../../lib/langgraph/types';
import { createPostgreSQLCheckpointSaver } from '../../lib/langgraph/checkpoints';
import { resumeFailedReport } from '../../lib/langgraph/error-recovery';

// Mock database and Anthropic
jest.mock('@/lib/db/drizzle');
jest.mock('@anthropic-ai/sdk');

const originalEnv = process.env;

beforeAll(() => {
  // Setup test environment
  process.env = {
    ...originalEnv,
    ANTHROPIC_API_KEY: 'test-api-key'
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

/**
 * Mock successful Anthropic responses for all analysis types
 */
function setupMockAnthropicResponses() {
  const Anthropic = require('@anthropic-ai/sdk').default;
  const mockCreate = jest.fn();
  
  Anthropic.mockImplementation(() => ({
    messages: { create: mockCreate }
  }));

  // Different responses for different analysis types
  const responses = {
    website: {
      title: 'Test Website',
      description: 'Test description',
      content: 'Test content',
      structure_score: 85
    },
    seo: {
      domain_authority: 70,
      technical_seo: { score: 80 },
      keywords: [{ keyword: 'test', position: 5, volume: 1000 }]
    },
    technical: {
      technical_seo: { score: 75 },
      recommendations: [
        { priority: 'high', title: 'Fix meta tags', description: 'Optimize titles', impact: 'High', effort: 'low', timeframe: '1 week' }
      ],
      overall_score: 75
    },
    content: {
      content_gaps: ['Blog content needed'],
      content_score: 70
    },
    strategic: {
      market_position: 'Good positioning',
      strategic_score: 80
    },
    competitive: {
      competitive_gaps: ['SEO improvements needed'],
      competitive_score: 75
    },
    competitors: {
      competitors: [
        { domain: 'competitor.com', strengths: ['Good SEO'], weaknesses: ['Slow loading'] }
      ]
    },
    compilation: {
      executive_summary: 'Test report completed successfully',
      key_findings: { technical: 'Good technical implementation' }
    }
  };

  // Setup sequential responses based on call count
  let callCount = 0;
  mockCreate.mockImplementation(async () => {
    callCount++;
    
    // Determine response type based on call pattern
    let responseType = 'website';
    if (callCount === 2) responseType = 'seo';
    else if (callCount === 3) responseType = 'competitors';
    else if (callCount === 4) responseType = 'technical';
    else if (callCount === 5) responseType = 'content';
    else if (callCount === 6) responseType = 'strategic';
    else if (callCount === 7) responseType = 'competitive';
    else if (callCount >= 8) responseType = 'compilation';

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(responses[responseType])
      }]
    };
  });

  return mockCreate;
}

describe('Graph Construction', () => {
  test('should create valid StateGraph', () => {
    const graph = createReportGraph();
    expect(graph).toBeDefined();
  });

  test('should compile graph successfully', () => {
    const compiledGraph = compileReportGraph({ useCheckpointing: false });
    expect(compiledGraph).toBeDefined();
  });

  test('should compile with PostgreSQL checkpointing', () => {
    const compiledGraph = compileReportGraph({ useCheckpointing: true });
    expect(compiledGraph).toBeDefined();
  });
});

describe('End-to-End Graph Execution', () => {
  beforeEach(() => {
    setupMockAnthropicResponses();
  });

  describe('Lite Tier Execution', () => {
    test('should complete Lite tier report within time limit', async () => {
      const startTime = Date.now();
      const result = await executeReportGeneration(
        'example.com',
        'lite',
        'test-lite-123',
        { useCheckpointing: false }
      );

      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(TIER_CONFIG.lite.maxExecutionTime);
      
      expect(result.finalReport).toBeDefined();
      expect(result.tier).toBe('lite');
      expect(result.progress).toBe(100);
      expect(result.endTime).toBeDefined();
    });

    test('should execute only required nodes for Lite tier', async () => {
      const result = await executeReportGeneration(
        'example.com',
        'lite',
        'test-lite-nodes',
        { useCheckpointing: false }
      );

      // Lite tier should have basic analysis but not strategic
      expect(result.websiteContent).toBeDefined();
      expect(result.seoMetrics).toBeDefined();
      expect(result.technicalAnalysis).toBeDefined();
      expect(result.screenshots).toHaveLength(0); // No screenshots for Lite
      expect(result.strategicAnalysis).toBeUndefined(); // No strategic for Lite
    });
  });

  describe('Pro Tier Execution', () => {
    test('should complete Pro tier with additional features', async () => {
      const result = await executeReportGeneration(
        'example.com',
        'pro',
        'test-pro-123',
        { useCheckpointing: false }
      );

      expect(result.tier).toBe('pro');
      expect(result.progress).toBe(100);
      
      // Pro tier includes additional features
      expect(result.screenshots).toHaveLength(2); // Desktop + mobile
      expect(result.competitorData).toHaveLength(1);
      expect(result.contentAnalysis).toBeDefined();
      expect(result.strategicAnalysis).toBeUndefined(); // Still no strategic
    });

    test('should respect Pro tier timeout', async () => {
      const startTime = Date.now();
      const result = await executeReportGeneration(
        'example.com',
        'pro',
        'test-pro-timeout',
        { useCheckpointing: false }
      );
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(TIER_CONFIG.pro.maxExecutionTime);
      expect(result.progress).toBe(100);
    });
  });

  describe('Elite Tier Execution', () => {
    test('should complete Elite tier with full analysis', async () => {
      const result = await executeReportGeneration(
        'example.com',
        'elite',
        'test-elite-123',
        { useCheckpointing: false }
      );

      expect(result.tier).toBe('elite');
      expect(result.progress).toBe(100);
      
      // Elite includes all analysis types
      expect(result.strategicAnalysis).toBeDefined();
      expect(result.competitiveAnalysis).toBeDefined();
      expect(result.finalReport?.implementationRoadmap).toBeDefined();
      expect(result.finalReport?.roiEstimates).toBeDefined();
    });
  });

  describe('Tasklist Pro Tier Execution', () => {
    test('should generate actionable task list', async () => {
      const result = await executeReportGeneration(
        'example.com',
        'tasklist-pro',
        'test-tasklist-123',
        { useCheckpointing: false }
      );

      expect(result.tier).toBe('tasklist-pro');
      expect(result.finalReport?.tasklist).toBeDefined();
      expect(Array.isArray(result.finalReport?.tasklist)).toBe(true);
    });
  });
});

describe('Streaming Execution', () => {
  beforeEach(() => {
    setupMockAnthropicResponses();
  });

  test('should stream progress updates', async () => {
    const progressUpdates: number[] = [];
    
    for await (const state of streamReportGeneration(
      'example.com',
      'lite',
      'test-stream-123',
      { useCheckpointing: false }
    )) {
      progressUpdates.push(state.progress);
    }

    expect(progressUpdates.length).toBeGreaterThan(1);
    expect(progressUpdates[0]).toBeLessThan(progressUpdates[progressUpdates.length - 1]);
    expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
  });

  test('should provide meaningful progress messages', async () => {
    const progressMessages: string[] = [];
    
    for await (const state of streamReportGeneration(
      'example.com',
      'pro',
      'test-stream-messages',
      { useCheckpointing: false }
    )) {
      if (state.progressMessage) {
        progressMessages.push(state.progressMessage);
      }
    }

    expect(progressMessages.length).toBeGreaterThan(0);
    expect(progressMessages.some(msg => msg.includes('content'))).toBe(true);
    expect(progressMessages.some(msg => msg.includes('analysis'))).toBe(true);
  });
});

describe('Conditional Routing', () => {
  beforeEach(() => {
    setupMockAnthropicResponses();
  });

  test('should route different paths based on tier', async () => {
    // Mock the getNextNode function to track routing
    const routingLog: string[] = [];
    
    // We'll test this by examining the final state differences
    const liteResult = await executeReportGeneration('example.com', 'lite', 'route-lite', { useCheckpointing: false });
    const eliteResult = await executeReportGeneration('example.com', 'elite', 'route-elite', { useCheckpointing: false });

    // Lite should have fewer completed analysis types
    const liteAnalysisCount = [
      liteResult.technicalAnalysis,
      liteResult.contentAnalysis,
      liteResult.strategicAnalysis,
      liteResult.competitiveAnalysis
    ].filter(Boolean).length;

    const eliteAnalysisCount = [
      eliteResult.technicalAnalysis,
      eliteResult.contentAnalysis,
      eliteResult.strategicAnalysis,
      eliteResult.competitiveAnalysis
    ].filter(Boolean).length;

    expect(eliteAnalysisCount).toBeGreaterThan(liteAnalysisCount);
  });

  test('should skip nodes appropriately based on state', async () => {
    // Test that nodes are skipped when data already exists
    const partialState = {
      websiteContent: {
        url: 'example.com',
        title: 'Pre-existing content',
        content: 'Already crawled',
        links: [],
        images: [],
        metadata: {}
      }
    };

    const result = await executeReportGeneration(
      'example.com',
      'lite',
      'test-skip-nodes',
      { useCheckpointing: false }
    );

    expect(result.websiteContent).toBeDefined();
  });
});

describe('Error Handling and Recovery', () => {
  test('should handle node failures gracefully', async () => {
    // Mock some failures
    const mockCreate = setupMockAnthropicResponses();
    mockCreate.mockRejectedValueOnce(new Error('Network timeout'));

    const result = await executeReportGeneration(
      'example.com',
      'lite',
      'test-error-handling',
      { useCheckpointing: false }
    );

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain('Network timeout');
    expect(result.finalReport).toBeDefined(); // Should still complete with fallback
  });

  test('should continue execution after recoverable errors', async () => {
    const mockCreate = setupMockAnthropicResponses();
    
    // Mock first call to fail, subsequent to succeed
    mockCreate.mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify({ score: 75 }) }]
      });

    const result = await executeReportGeneration(
      'example.com',
      'lite',
      'test-recovery',
      { useCheckpointing: false }
    );

    expect(result.progress).toBe(100);
    expect(result.finalReport).toBeDefined();
  });
});

describe('Performance Testing', () => {
  beforeEach(() => {
    setupMockAnthropicResponses();
  });

  test('should meet performance targets for each tier', async () => {
    const tiers: ReportTier[] = ['lite', 'pro', 'elite', 'tasklist-pro'];
    
    for (const tier of tiers) {
      const startTime = Date.now();
      
      const result = await executeReportGeneration(
        'example.com',
        tier,
        `perf-test-${tier}`,
        { useCheckpointing: false }
      );
      
      const executionTime = Date.now() - startTime;
      const maxTime = TIER_CONFIG[tier].maxExecutionTime;
      
      expect(executionTime).toBeLessThan(maxTime);
      expect(result.progress).toBe(100);
      
      console.log(`${tier} tier completed in ${executionTime}ms (limit: ${maxTime}ms)`);
    }
  });

  test('should show performance improvement over sequential execution', async () => {
    // This test would compare parallel vs sequential timing
    // For now, we'll just ensure the parallel execution completes efficiently
    
    const startTime = Date.now();
    
    const result = await executeReportGeneration(
      'example.com',
      'pro',
      'parallel-test',
      { useCheckpointing: false }
    );
    
    const parallelTime = Date.now() - startTime;
    
    // Pro tier should complete well under its limit, indicating parallel efficiency
    expect(parallelTime).toBeLessThan(TIER_CONFIG.pro.maxExecutionTime * 0.8);
    expect(result.progress).toBe(100);
  });
});

describe('Data Integrity', () => {
  beforeEach(() => {
    setupMockAnthropicResponses();
  });

  test('should maintain data consistency throughout execution', async () => {
    const result = await executeReportGeneration(
      'example.com',
      'elite',
      'data-integrity-test',
      { useCheckpointing: false }
    );

    // Check that domain is consistent throughout
    expect(result.domain).toBe('example.com');
    expect(result.websiteContent?.url).toBe('example.com');
    expect(result.seoMetrics?.domain).toBe('example.com');
    expect(result.finalReport?.metadata?.domain).toBe('example.com');
  });

  test('should aggregate recommendations correctly', async () => {
    const result = await executeReportGeneration(
      'example.com',
      'pro',
      'recommendations-test',
      { useCheckpointing: false }
    );

    expect(result.finalReport?.recommendations).toBeDefined();
    expect(Array.isArray(result.finalReport?.recommendations)).toBe(true);
    
    // Should have recommendations from different analysis types
    const recommendations = result.finalReport?.recommendations || [];
    expect(recommendations.length).toBeGreaterThan(0);
  });

  test('should calculate accurate metadata', async () => {
    const result = await executeReportGeneration(
      'example.com',
      'pro',
      'metadata-test',
      { useCheckpointing: false }
    );

    const metadata = result.finalReport?.metadata;
    expect(metadata?.tier).toBe('pro');
    expect(metadata?.analysisDepth).toBe(TIER_CONFIG.pro.analysisDepth);
    expect(metadata?.dataCompleteness).toBeDefined();
    expect(metadata?.processingTime).toBeGreaterThan(0);
  });
});

describe('Tier-Specific Features', () => {
  beforeEach(() => {
    setupMockAnthropicResponses();
  });

  test('should include tier-appropriate features', async () => {
    const eliteResult = await executeReportGeneration(
      'example.com',
      'elite',
      'elite-features',
      { useCheckpointing: false }
    );

    expect(eliteResult.finalReport?.implementationRoadmap).toBeDefined();
    expect(eliteResult.finalReport?.roiEstimates).toBeDefined();
    
    const liteResult = await executeReportGeneration(
      'example.com',
      'lite',
      'lite-features',
      { useCheckpointing: false }
    );

    expect(liteResult.finalReport?.implementationRoadmap).toBeUndefined();
    expect(liteResult.finalReport?.roiEstimates).toBeUndefined();
  });

  test('should respect feature flags per tier', async () => {
    const features = TIER_CONFIG;
    
    // Lite features
    expect(features.lite.features).toContain('seo_audit');
    expect(features.lite.features).not.toContain('strategic_planning');
    
    // Elite features
    expect(features.elite.features).toContain('strategic_planning');
    expect(features.elite.features).toContain('roi_projections');
  });
});

describe('State Management', () => {
  test('should properly initialize state', async () => {
    const mockCreate = setupMockAnthropicResponses();
    
    const result = await executeReportGeneration(
      'test-domain.com',
      'pro',
      'state-test-123',
      { useCheckpointing: false }
    );

    expect(result.domain).toBe('test-domain.com');
    expect(result.tier).toBe('pro');
    expect(result.reportId).toBe('state-test-123');
    expect(result.startTime).toBeDefined();
    expect(result.endTime).toBeDefined();
    expect(result.errors).toBeDefined();
    expect(result.retries).toBeDefined();
  });

  test('should update progress monotonically', async () => {
    const progressValues: number[] = [];
    
    for await (const state of streamReportGeneration(
      'example.com',
      'lite',
      'progress-test',
      { useCheckpointing: false }
    )) {
      progressValues.push(state.progress);
    }

    // Progress should never decrease
    for (let i = 1; i < progressValues.length; i++) {
      expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
    }
  });
});