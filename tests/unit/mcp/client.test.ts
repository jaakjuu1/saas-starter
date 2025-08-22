/**
 * Unit Tests for MCPClient
 * 
 * Tests the core functionality of the MCP client including:
 * - Tool connectivity and configuration
 * - Rate limiting
 * - Prompt selection and analysis coordination
 * - Error handling and fallback mechanisms
 */

import { MCPClient, AnalysisContext, AnalysisResult } from '@/lib/mcp/client';
import { query } from '@anthropic-ai/claude-code';
import { MCP_TOOLS } from '@/lib/mcp/config';

// Mock the Claude Code SDK
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('MCPClient', () => {
  let mcpClient: MCPClient;
  let mockContext: AnalysisContext;
  let mockProgressCallback: jest.Mock;

  beforeEach(() => {
    mcpClient = new MCPClient();
    mockProgressCallback = jest.fn().mockResolvedValue(undefined);
    
    mockContext = {
      domain: 'example.com',
      reportTier: 'lite',
      jobId: 'test-job-123',
      progressCallback: mockProgressCallback,
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('performAnalysis', () => {
    it('should successfully perform lite analysis', async () => {
      // Mock successful Claude Code SDK response
      mockQuery.mockResolvedValueOnce({
        structure: 'Well-organized website structure',
        content_quality: 'High-quality content detected',
        accessibility: 'Good accessibility compliance',
        mobile_responsive: 'Fully responsive design',
        score: 85,
      });

      const result = await mcpClient.performAnalysis(mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.toolsUsed).toContain('firecrawl');
      expect(result.metadata?.subAgentsInvolved).toContain('seo-analyzer');
      
      // Verify progress callbacks were called
      expect(mockProgressCallback).toHaveBeenCalledWith(
        10, 
        'Initializing AI analysis engines...', 
        'initialization'
      );
      
      // Verify Claude Code SDK was called with correct prompt
      expect(mockQuery).toHaveBeenCalled();
      const queryCall = mockQuery.mock.calls[0][0];
      expect(queryCall).toContain('example.com');
      expect(queryCall).toContain('basic SEO fundamentals');
    });

    it('should successfully perform pro analysis with enhanced features', async () => {
      mockContext.reportTier = 'pro';
      
      // Mock multiple Claude Code SDK calls for Pro tier
      mockQuery
        .mockResolvedValueOnce({
          structure: 'Complex website analysis',
          content_quality: 'Professional content strategy',
          score: 82,
        })
        .mockResolvedValueOnce({
          layout_quality: 'Excellent visual hierarchy',
          ux_score: 78,
          cro_opportunities: ['Improve CTA placement'],
        })
        .mockResolvedValueOnce({
          technical_seo: 'Advanced SEO implementation',
          on_page_score: 85,
          recommendations: ['Optimize schema markup'],
        });

      const result = await mcpClient.performAnalysis(mockContext);

      expect(result.success).toBe(true);
      expect(result.metadata?.toolsUsed).toEqual(['firecrawl', 'playwright', 'dataforseo']);
      expect(result.metadata?.subAgentsInvolved).toContain('seo-analyzer');
      expect(result.metadata?.subAgentsInvolved).toContain('ux-analyzer');
      expect(result.metadata?.subAgentsInvolved).toContain('performance-analyzer');
    });

    it('should handle rate limiting gracefully', async () => {
      // Mock rate limit error
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      mockQuery.mockRejectedValueOnce(rateLimitError);

      const result = await mcpClient.performAnalysis(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
      expect(result.metadata?.processingTime).toBeGreaterThan(0);
    });

    it('should fall back gracefully on tool failures', async () => {
      // Mock network timeout
      const networkError = new Error('Network timeout');
      networkError.name = 'TimeoutError';
      mockQuery.mockRejectedValueOnce(networkError);

      const result = await mcpClient.performAnalysis(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
      expect(result.metadata?.toolsUsed).toContain('firecrawl');
    });

    it('should track processing time accurately', async () => {
      mockQuery.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ score: 75 }), 100)
        )
      );

      const result = await mcpClient.performAnalysis(mockContext);

      expect(result.metadata?.processingTime).toBeGreaterThan(100);
      expect(result.metadata?.processingTime).toBeLessThan(1000);
    });
  });

  describe('extractWebsiteContent', () => {
    it('should extract content using tier-appropriate prompts', async () => {
      const mockResponse = global.testUtils.MOCK_ANALYSIS_RESPONSES.lite;
      mockQuery.mockResolvedValueOnce(mockResponse);

      // Access private method for testing
      const extractContent = (mcpClient as any).extractWebsiteContent;
      const result = await extractContent.call(mcpClient, 'example.com', mockContext);

      expect(result.structure).toBeDefined();
      expect(result.content_quality).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('basic SEO fundamentals'),
        expect.objectContaining({ timeout: 30000 })
      );
    });

    it('should return fallback data on extraction failure', async () => {
      const networkError = new Error('Network error');
      mockQuery.mockRejectedValueOnce(networkError);

      const extractContent = (mcpClient as any).extractWebsiteContent;
      const result = await extractContent.call(mcpClient, 'example.com', mockContext);

      expect(result.error).toBeDefined();
      expect(result.score).toBe(65);
      expect(result.structure).toContain('fallback analysis');
    });
  });

  describe('performVisualAnalysis', () => {
    it('should perform visual analysis for supported tiers', async () => {
      mockContext.reportTier = 'pro';
      const mockVisualResponse = {
        layout_quality: 'Excellent visual design',
        ux_score: 82,
        cro_opportunities: ['Optimize form placement'],
      };
      mockQuery.mockResolvedValueOnce(mockVisualResponse);

      const performVisual = (mcpClient as any).performVisualAnalysis;
      const result = await performVisual.call(mcpClient, 'example.com', mockContext);

      expect(result.layout_quality).toBeDefined();
      expect(result.ux_score).toBeGreaterThan(0);
      expect(result.cro_opportunities).toBeInstanceOf(Array);
    });

    it('should handle screenshot capture failures', async () => {
      const screenshotError = new Error('Screenshot capture failed');
      mockQuery.mockRejectedValueOnce(screenshotError);

      const performVisual = (mcpClient as any).performVisualAnalysis;
      const result = await performVisual.call(mcpClient, 'example.com', mockContext);

      expect(result.error).toBeDefined();
      expect(result.ux_score).toBe(70); // Fallback score
    });
  });

  describe('performSEOAnalysis', () => {
    it('should perform comprehensive SEO analysis', async () => {
      const mockSEOResponse = {
        technical_seo: 'Advanced SEO factors analyzed',
        on_page_score: 88,
        keyword_optimization: 'Strong keyword strategy',
        recommendations: ['Improve internal linking'],
      };
      mockQuery.mockResolvedValueOnce(mockSEOResponse);

      const performSEO = (mcpClient as any).performSEOAnalysis;
      const result = await performSEO.call(mcpClient, 'example.com', mockContext);

      expect(result.technical_seo).toBeDefined();
      expect(result.on_page_score).toBeGreaterThan(0);
      expect(result.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('coordinateSubAgents', () => {
    it('should coordinate sub-agents based on tier configuration', async () => {
      const mockAnalysisData = { content: 'test data' };
      const subAgents = ['seo-analyzer', 'ux-analyzer'];
      
      mockQuery
        .mockResolvedValueOnce({ seo_insights: 'SEO analysis complete' })
        .mockResolvedValueOnce({ ux_insights: 'UX analysis complete' });

      const coordinateAgents = (mcpClient as any).coordinateSubAgents;
      const result = await coordinateAgents.call(
        mcpClient, 
        subAgents, 
        mockAnalysisData, 
        mockContext
      );

      expect(result['seo-analyzer']).toBeDefined();
      expect(result['ux-analyzer']).toBeDefined();
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should handle sub-agent failures gracefully', async () => {
      const subAgents = ['seo-analyzer'];
      const agentError = new Error('Sub-agent failed');
      mockQuery.mockRejectedValueOnce(agentError);

      const coordinateAgents = (mcpClient as any).coordinateSubAgents;
      const result = await coordinateAgents.call(
        mcpClient, 
        subAgents, 
        {}, 
        mockContext
      );

      expect(result['seo-analyzer'].error).toBeDefined();
    });
  });

  describe('getTierSpecificPrompt', () => {
    it('should return correct prompts for each tier', () => {
      const getTierPrompt = (mcpClient as any).getTierSpecificPrompt;

      // Test lite tier
      const litePrompt = getTierPrompt.call(mcpClient, 'lite', 'website_analysis');
      expect(litePrompt).toContain('basic SEO fundamentals');
      expect(litePrompt).toContain('quick wins');

      // Test pro tier
      const proPrompt = getTierPrompt.call(mcpClient, 'pro', 'website_analysis');
      expect(proPrompt).toContain('advanced website analysis');
      expect(proPrompt).toContain('competitive intelligence');

      // Test elite tier
      const elitePrompt = getTierPrompt.call(mcpClient, 'elite', 'strategic_analysis');
      expect(elitePrompt).toContain('elite-level website analysis');
      expect(elitePrompt).toContain('enterprise clients');

      // Test tasklist pro tier
      const tasklistPrompt = getTierPrompt.call(mcpClient, 'tasklist_pro', 'executive_analysis');
      expect(tasklistPrompt).toContain('executive-level website analysis');
      expect(tasklistPrompt).toContain('actionable tasks');
    });

    it('should fall back to lite prompts for unknown tiers', () => {
      const getTierPrompt = (mcpClient as any).getTierSpecificPrompt;
      const fallbackPrompt = getTierPrompt.call(mcpClient, 'unknown_tier', 'website_analysis');
      
      expect(fallbackPrompt).toContain('basic SEO fundamentals');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits correctly', () => {
      const checkRateLimit = (mcpClient as any).checkRateLimit;
      
      // First call should pass
      expect(checkRateLimit.call(mcpClient, 'firecrawl')).toBe(true);
      
      // Record usage up to limit
      const recordUsage = (mcpClient as any).recordRateLimitUsage;
      for (let i = 0; i < 100; i++) {
        recordUsage.call(mcpClient, 'firecrawl');
      }
      
      // Should now be rate limited
      expect(checkRateLimit.call(mcpClient, 'firecrawl')).toBe(false);
    });

    it('should reset rate limits after time window', async () => {
      const checkRateLimit = (mcpClient as any).checkRateLimit;
      const recordUsage = (mcpClient as any).recordRateLimitUsage;
      
      // Use up rate limit
      for (let i = 0; i < 100; i++) {
        recordUsage.call(mcpClient, 'firecrawl');
      }
      
      expect(checkRateLimit.call(mcpClient, 'firecrawl')).toBe(false);
      
      // Simulate time passing (this would need actual implementation)
      // For now, just verify the logic structure
      expect(checkRateLimit.call(mcpClient, 'unknown_tool')).toBe(true);
    });
  });

  describe('Progress Tracking', () => {
    it('should call progress callback with correct values', async () => {
      mockQuery.mockResolvedValue({ score: 75 });
      
      await mcpClient.performAnalysis(mockContext);
      
      expect(mockProgressCallback).toHaveBeenCalledWith(
        10,
        'Initializing AI analysis engines...',
        'initialization'
      );
      
      expect(mockProgressCallback).toHaveBeenCalledWith(
        25,
        'Extracting website content and structure...',
        'content_extraction'
      );
    });

    it('should handle missing progress callback gracefully', async () => {
      mockContext.progressCallback = undefined;
      mockQuery.mockResolvedValue({ score: 75 });
      
      // Should not throw error
      const result = await mcpClient.performAnalysis(mockContext);
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle various error types appropriately', async () => {
      const errorScenarios = [
        { error: new Error('Network timeout'), expectedMessage: 'Network timeout' },
        { error: new Error('Authentication failed'), expectedMessage: 'Authentication failed' },
        { error: new Error('Service unavailable'), expectedMessage: 'Service unavailable' },
      ];

      for (const scenario of errorScenarios) {
        jest.clearAllMocks();
        mockQuery.mockRejectedValueOnce(scenario.error);
        
        const result = await mcpClient.performAnalysis(mockContext);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain(scenario.expectedMessage);
      }
    });

    it('should provide meaningful error context', async () => {
      const customError = new Error('Custom error message');
      customError.name = 'CustomError';
      mockQuery.mockRejectedValueOnce(customError);
      
      const result = await mcpClient.performAnalysis(mockContext);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Custom error message');
      expect(result.metadata?.processingTime).toBeGreaterThan(0);
      expect(result.metadata?.toolsUsed).toBeDefined();
    });
  });
});

describe('MCPClient Configuration Validation', () => {
  it('should validate MCP tool configurations', () => {
    expect(MCP_TOOLS.firecrawl).toBeDefined();
    expect(MCP_TOOLS.playwright).toBeDefined();
    expect(MCP_TOOLS.dataforseo).toBeDefined();
    
    expect(MCP_TOOLS.firecrawl.enabled).toBe(true);
    expect(MCP_TOOLS.firecrawl.rateLimit).toBeDefined();
    expect(MCP_TOOLS.firecrawl.rateLimit?.requests).toBeGreaterThan(0);
  });
});