/**
 * Unit Tests for LangGraph Nodes
 * 
 * Comprehensive unit tests for each node: data collection nodes (mock MCP responses),
 * analysis nodes (verify prompt usage), compilation node (test aggregation logic).
 * Tests error handling and retry mechanisms.
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { crawlWebsite, fetchSEOMetrics, captureScreenshots } from '../../lib/langgraph/nodes/data-collection';
import { analyzeCompetitors } from '../../lib/langgraph/nodes/competitors';
import { 
  performTechnicalAnalysis,
  performContentAnalysis,
  performStrategicAnalysis,
  performCompetitiveAnalysis
} from '../../lib/langgraph/nodes/analysis';
import { compileReport } from '../../lib/langgraph/nodes/compile';
import { ReportState, ReportTier } from '../../lib/langgraph/types';

// Mock Anthropic client
jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn()
    }
  }))
}));

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...originalEnv,
    ANTHROPIC_API_KEY: 'test-api-key'
  };
});

afterEach(() => {
  process.env = originalEnv;
  jest.clearAllMocks();
});

/**
 * Create base test state for different tiers
 */
function createTestState(tier: ReportTier, overrides: Partial<ReportState> = {}): ReportState {
  return {
    domain: 'example.com',
    tier,
    reportId: 'test-report-123',
    websiteContent: undefined,
    seoMetrics: undefined,
    screenshots: [],
    competitorData: [],
    technicalAnalysis: undefined,
    contentAnalysis: undefined,
    strategicAnalysis: undefined,
    competitiveAnalysis: undefined,
    finalReport: undefined,
    progress: 0,
    progressMessage: 'Starting test...',
    errors: [],
    retries: {},
    startTime: Date.now(),
    endTime: undefined,
    messages: [],
    checkpointId: undefined,
    ...overrides
  };
}

/**
 * Mock successful Anthropic API response
 */
function mockAnthropicSuccess(responseData: any = {}) {
  const Anthropic = require('@anthropic-ai/sdk').default;
  const mockCreate = Anthropic.prototype.messages?.create || jest.fn();
  
  mockCreate.mockResolvedValue({
    content: [{
      type: 'text',
      text: JSON.stringify({
        analysis: 'Test analysis completed',
        score: 85,
        recommendations: ['Test recommendation'],
        ...responseData
      })
    }]
  });
}

/**
 * Mock Anthropic API failure
 */
function mockAnthropicFailure(error: Error) {
  const Anthropic = require('@anthropic-ai/sdk').default;
  const mockCreate = Anthropic.prototype.messages?.create || jest.fn();
  
  mockCreate.mockRejectedValue(error);
}

describe('Data Collection Nodes', () => {
  describe('crawlWebsite', () => {
    test('should successfully extract website content', async () => {
      mockAnthropicSuccess({
        title: 'Test Website',
        description: 'Test description',
        content: 'Test content',
        structure_score: 85,
        content_quality: 'Good'
      });

      const state = createTestState('lite');
      const result = await crawlWebsite(state);

      expect(result.websiteContent).toBeDefined();
      expect(result.websiteContent?.url).toBe('example.com');
      expect(result.websiteContent?.title).toBe('Test Website');
      expect(result.websiteContent?.metadata?.structure_score).toBe(85);
      expect(result.progress).toBeGreaterThan(state.progress);
      expect(result.progressMessage).toContain('completed');
    });

    test('should handle API failures gracefully', async () => {
      mockAnthropicFailure(new Error('API timeout'));

      const state = createTestState('lite');
      const result = await crawlWebsite(state);

      expect(result.websiteContent).toBeDefined();
      expect(result.websiteContent?.error).toContain('timeout');
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].node).toBe('crawlWebsite');
    });

    test('should handle missing API key', async () => {
      delete process.env.ANTHROPIC_API_KEY;

      const state = createTestState('lite');
      
      await expect(crawlWebsite(state)).rejects.toThrow('ANTHROPIC_API_KEY not found');
    });
  });

  describe('fetchSEOMetrics', () => {
    test('should collect comprehensive SEO metrics', async () => {
      mockAnthropicSuccess({
        domain_authority: 70,
        page_authority: 65,
        technical_issues: [
          {
            type: 'meta_description',
            severity: 'medium',
            description: 'Missing meta descriptions',
            count: 3
          }
        ]
      });

      const state = createTestState('pro');
      const result = await fetchSEOMetrics(state);

      expect(result.seoMetrics).toBeDefined();
      expect(result.seoMetrics?.domain).toBe('example.com');
      expect(result.seoMetrics?.metrics?.domainAuthority).toBe(70);
      expect(result.seoMetrics?.technicalIssues).toHaveLength(1);
    });

    test('should provide fallback metrics on failure', async () => {
      mockAnthropicFailure(new Error('Rate limit exceeded'));

      const state = createTestState('pro');
      const result = await fetchSEOMetrics(state);

      expect(result.seoMetrics?.error).toContain('Rate limit');
      expect(result.seoMetrics?.metrics?.domainAuthority).toBe(50);
      expect(result.seoMetrics?.technicalIssues).toHaveLength(1);
      expect(result.seoMetrics?.technicalIssues![0].type).toBe('analysis_limited');
    });
  });

  describe('captureScreenshots', () => {
    test('should capture screenshots for Pro+ tiers', async () => {
      mockAnthropicSuccess({
        desktop_screenshot: '/path/to/desktop.png',
        mobile_screenshot: '/path/to/mobile.png'
      });

      const state = createTestState('pro');
      const result = await captureScreenshots(state);

      expect(result.screenshots).toHaveLength(2);
      expect(result.screenshots![0].type).toBe('desktop');
      expect(result.screenshots![1].type).toBe('mobile');
    });

    test('should skip screenshots for Lite tier', async () => {
      const state = createTestState('lite');
      const result = await captureScreenshots(state);

      expect(result.screenshots).toHaveLength(0);
      expect(result.progress).toBe(state.progress);
    });

    test('should handle screenshot failures', async () => {
      mockAnthropicFailure(new Error('Screenshot failed'));

      const state = createTestState('pro');
      const result = await captureScreenshots(state);

      expect(result.screenshots).toHaveLength(2);
      expect(result.screenshots![0].error).toContain('Screenshot failed');
    });
  });
});

describe('Analysis Nodes', () => {
  describe('performTechnicalAnalysis', () => {
    test('should perform technical analysis for all tiers', async () => {
      mockAnthropicSuccess({
        technical_seo: { score: 80 },
        recommendations: [
          {
            priority: 'high',
            title: 'Fix meta tags',
            description: 'Optimize page titles and descriptions'
          }
        ],
        overall_score: 75
      });

      const state = createTestState('lite', {
        websiteContent: {
          url: 'example.com',
          title: 'Test Site',
          content: 'Test content',
          links: [],
          images: [],
          metadata: { structure_score: 80 }
        }
      });

      const result = await performTechnicalAnalysis(state);

      expect(result.technicalAnalysis).toBeDefined();
      expect(result.technicalAnalysis?.type).toBe('technical');
      expect(result.technicalAnalysis?.score).toBe(75);
      expect(result.technicalAnalysis?.recommendations).toHaveLength(1);
    });

    test('should use different prompts for different tiers', async () => {
      const mockCreate = jest.fn();
      const Anthropic = require('@anthropic-ai/sdk').default;
      Anthropic.mockImplementation(() => ({ messages: { create: mockCreate } }));
      
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify({ score: 80 }) }]
      });

      // Test lite tier
      const liteState = createTestState('lite');
      await performTechnicalAnalysis(liteState);
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        messages: [expect.objectContaining({
          content: expect.stringContaining('Tier: lite')
        })]
      }));

      // Test elite tier  
      const eliteState = createTestState('elite');
      await performTechnicalAnalysis(eliteState);
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        messages: [expect.objectContaining({
          content: expect.stringContaining('Tier: elite')
        })]
      }));
    });
  });

  describe('performContentAnalysis', () => {
    test('should skip content analysis for Lite tier', async () => {
      const state = createTestState('lite');
      const result = await performContentAnalysis(state);

      expect(result.contentAnalysis).toBeUndefined();
      expect(result.progress).toBe(state.progress);
    });

    test('should perform content analysis for Pro+ tiers', async () => {
      mockAnthropicSuccess({
        content_gaps: ['Missing blog content'],
        content_score: 70
      });

      const state = createTestState('pro', {
        competitorData: [
          {
            domain: 'competitor.com',
            analysis: {
              strengths: ['Good content'],
              weaknesses: ['Slow loading'],
              opportunities: ['Mobile optimization'],
              threats: ['High competition']
            }
          }
        ]
      });

      const result = await performContentAnalysis(state);

      expect(result.contentAnalysis).toBeDefined();
      expect(result.contentAnalysis?.type).toBe('content');
      expect(result.contentAnalysis?.score).toBe(70);
    });
  });

  describe('performStrategicAnalysis', () => {
    test('should only run for Elite tiers', async () => {
      const proState = createTestState('pro');
      const proResult = await performStrategicAnalysis(proState);
      expect(proResult.strategicAnalysis).toBeUndefined();

      mockAnthropicSuccess({ strategic_score: 85 });
      
      const eliteState = createTestState('elite');
      const eliteResult = await performStrategicAnalysis(eliteState);
      expect(eliteResult.strategicAnalysis).toBeDefined();
    });
  });
});

describe('Compilation Node', () => {
  describe('compileReport', () => {
    test('should compile comprehensive report', async () => {
      mockAnthropicSuccess({
        executive_summary: 'Test executive summary',
        key_findings: { technical: 'Good technical implementation' },
        recommendations: [{ priority: 'high', title: 'Test rec' }]
      });

      const state = createTestState('pro', {
        progress: 95,
        technicalAnalysis: {
          type: 'technical',
          score: 80,
          findings: { technical_seo: 'Good' },
          recommendations: [{ priority: 'medium', title: 'Fix headers', description: 'Improve H1 tags', impact: 'High', effort: 'low', timeframe: '1 week' }]
        },
        contentAnalysis: {
          type: 'content',
          score: 75,
          findings: { content_quality: 'Good' },
          recommendations: []
        }
      });

      const result = await compileReport(state);

      expect(result.finalReport).toBeDefined();
      expect(result.finalReport?.metadata?.tier).toBe('pro');
      expect(result.finalReport?.executiveSummary).toBe('Test executive summary');
      expect(result.progress).toBe(100);
      expect(result.endTime).toBeDefined();
    });

    test('should handle missing analysis data gracefully', async () => {
      mockAnthropicSuccess();

      const state = createTestState('lite', {
        progress: 95,
        // No analysis data
      });

      const result = await compileReport(state);

      expect(result.finalReport).toBeDefined();
      expect(result.finalReport?.metadata?.dataCompleteness).toBeDefined();
      expect(result.finalReport?.metadata?.dataCompleteness?.technicalAnalysis).toBe(false);
    });

    test('should generate tasklist for Tasklist Pro tier', async () => {
      // Mock tasklist generation
      mockAnthropicSuccess({
        tasks: [
          {
            id: 1,
            title: 'Optimize page titles',
            priority: 'High',
            effort: 'Medium'
          }
        ]
      });

      const state = createTestState('tasklist-pro', {
        progress: 95,
        technicalAnalysis: {
          type: 'technical',
          score: 80,
          findings: {},
          recommendations: []
        }
      });

      const result = await compileReport(state);

      expect(result.finalReport?.tasklist).toBeDefined();
      expect(result.finalReport?.tasklist).toHaveLength(1);
    });

    test('should provide fallback report on compilation failure', async () => {
      mockAnthropicFailure(new Error('Compilation failed'));

      const state = createTestState('lite', { progress: 95 });
      const result = await compileReport(state);

      expect(result.finalReport).toBeDefined();
      expect(result.finalReport?.error).toContain('Compilation failed');
      expect(result.errors).toHaveLength(1);
    });
  });
});

describe('Competitor Analysis Node', () => {
  describe('analyzeCompetitors', () => {
    test('should skip for Lite tier', async () => {
      const state = createTestState('lite');
      const result = await analyzeCompetitors(state);

      expect(result.competitorData).toHaveLength(0);
    });

    test('should analyze competitors for Pro+ tiers', async () => {
      mockAnthropicSuccess({
        competitors: [
          {
            domain: 'competitor1.com',
            strengths: ['Good SEO'],
            weaknesses: ['Slow site'],
            domain_authority: 60
          }
        ]
      });

      const state = createTestState('pro', {
        websiteContent: {
          url: 'example.com',
          metadata: { industry: 'ecommerce' }
        }
      });

      const result = await analyzeCompetitors(state);

      expect(result.competitorData).toHaveLength(1);
      expect(result.competitorData![0].domain).toBe('competitor1.com');
      expect(result.competitorData![0].analysis?.strengths).toContain('Good SEO');
    });

    test('should provide fallback competitors on failure', async () => {
      mockAnthropicFailure(new Error('Competitor analysis failed'));

      const state = createTestState('pro');
      const result = await analyzeCompetitors(state);

      expect(result.competitorData).toHaveLength(1);
      expect(result.competitorData![0].error).toContain('failed');
    });
  });
});

describe('Error Handling', () => {
  test('all nodes should handle API key missing error', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    
    const state = createTestState('pro');
    
    await expect(crawlWebsite(state)).rejects.toThrow('API_KEY not found');
    await expect(fetchSEOMetrics(state)).rejects.toThrow('API_KEY not found');
    await expect(performTechnicalAnalysis(state)).rejects.toThrow('API_KEY not found');
  });

  test('all nodes should update progress appropriately', async () => {
    mockAnthropicSuccess();
    
    const state = createTestState('pro', { progress: 10 });
    
    const crawlResult = await crawlWebsite(state);
    expect(crawlResult.progress).toBeGreaterThan(10);
    
    const seoResult = await fetchSEOMetrics(state);
    expect(seoResult.progress).toBeGreaterThan(10);
  });

  test('nodes should add errors to state on failure', async () => {
    mockAnthropicFailure(new Error('Test error'));
    
    const state = createTestState('pro');
    const result = await crawlWebsite(state);
    
    expect(result.errors).toHaveLength(1);
    expect(result.errors![0].node).toBe('crawlWebsite');
    expect(result.errors![0].error).toContain('Test error');
    expect(result.errors![0].timestamp).toBeDefined();
  });
});

describe('Node Configuration', () => {
  test('should respect tier configurations', () => {
    const { TIER_CONFIG } = require('../../lib/langgraph/types');
    
    expect(TIER_CONFIG.lite.nodes).toContain('performTechnicalAnalysis');
    expect(TIER_CONFIG.lite.nodes).not.toContain('performStrategicAnalysis');
    
    expect(TIER_CONFIG.elite.nodes).toContain('performStrategicAnalysis');
    expect(TIER_CONFIG.elite.nodes).toContain('performCompetitiveAnalysis');
  });

  test('should have appropriate timeouts per tier', () => {
    const { TIER_CONFIG } = require('../../lib/langgraph/types');
    
    expect(TIER_CONFIG.lite.maxExecutionTime).toBeLessThan(TIER_CONFIG.pro.maxExecutionTime);
    expect(TIER_CONFIG.pro.maxExecutionTime).toBeLessThan(TIER_CONFIG.elite.maxExecutionTime);
  });
});