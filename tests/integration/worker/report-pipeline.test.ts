/**
 * Integration Tests for Report Generation Pipeline
 * 
 * Tests the complete flow from job creation through MCP analysis to database storage
 */

import { Job } from 'bullmq';
import { ReportJobData } from '@/lib/queue/report-queue';
import { query } from '@anthropic-ai/claude-code';

// Import the functions we want to test
const mockQuery = query as jest.MockedFunction<typeof query>;

// Mock database operations
const mockDb = {
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@/lib/db/drizzle', () => ({
  db: mockDb,
}));

describe('Report Generation Pipeline Integration', () => {
  let mockJob: Partial<Job<ReportJobData>>;

  beforeEach(() => {
    mockJob = {
      id: 'test-job-123',
      data: {
        reportId: 1,
        domain: 'example.com',
        reportTier: 'lite',
        userId: 1,
        customerEmail: 'test@example.com',
      },
      updateProgress: jest.fn().mockResolvedValue(undefined),
    };

    jest.clearAllMocks();
  });

  describe('Lite Report Generation', () => {
    it('should complete lite report generation successfully', async () => {
      // Mock successful Claude Code SDK response
      mockQuery.mockResolvedValue({
        structure: 'Well-organized website with clear navigation',
        content_quality: 'High-quality content with good SEO basics',
        accessibility: 'Basic accessibility features implemented',
        mobile_responsive: 'Responsive design works well',
        score: 82,
        recommendations: [
          'Optimize meta descriptions for better CTR',
          'Compress images to improve load speed',
          'Add more internal links for better navigation'
        ]
      });

      // Import and test the worker function
      const { processReport } = await import('@/lib/workers/report-worker');
      
      const result = await processReport(mockJob as Job<ReportJobData>);

      // Verify successful completion
      expect(result.domain).toBe('example.com');
      expect(result.reportTier).toBe('lite');
      expect(result.analysis).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.tierFeatures.basic_seo).toBeDefined();
      expect(result.tierFeatures.quick_wins).toBeInstanceOf(Array);

      // Verify progress tracking was called
      expect(mockJob.updateProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          progress: 10,
          stage: 'initialization'
        })
      );

      // Verify database updates
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalled();
    });

    it('should handle lite report with fallback analysis', async () => {
      // Mock Claude Code SDK failure
      mockQuery.mockRejectedValue(new Error('Service temporarily unavailable'));

      const { processReport } = await import('@/lib/workers/report-worker');
      
      const result = await processReport(mockJob as Job<ReportJobData>);

      // Should still complete with fallback
      expect(result.domain).toBe('example.com');
      expect(result.reportTier).toBe('lite');
      expect(result.metadata?.analysisType).toBeDefined();
    });
  });

  describe('Pro Report Generation', () => {
    beforeEach(() => {
      mockJob.data!.reportTier = 'pro';
    });

    it('should complete pro report with enhanced features', async () => {
      // Mock multiple Claude Code SDK calls for Pro tier
      mockQuery
        .mockResolvedValueOnce({
          structure: 'Complex site with advanced features',
          content_quality: 'Professional content strategy',
          score: 85,
        })
        .mockResolvedValueOnce({
          layout_quality: 'Excellent visual hierarchy',
          ux_score: 78,
          cro_opportunities: ['Improve CTA placement', 'Optimize form design'],
        })
        .mockResolvedValueOnce({
          technical_seo: 'Advanced SEO implementation',
          on_page_score: 88,
          recommendations: ['Implement schema markup', 'Optimize Core Web Vitals'],
        })
        .mockResolvedValueOnce({
          seo_insights: 'SEO analysis complete',
        })
        .mockResolvedValueOnce({
          ux_insights: 'UX analysis complete',
        })
        .mockResolvedValueOnce({
          performance_insights: 'Performance analysis complete',
        })
        .mockResolvedValueOnce({
          executive_summary: 'Pro-level analysis with strategic insights',
          recommendations: ['Strategic SEO improvements', 'UX optimization priorities'],
        });

      const { processReport } = await import('@/lib/workers/report-worker');
      
      const result = await processReport(mockJob as Job<ReportJobData>);

      // Verify Pro tier features
      expect(result.tierFeatures.advanced_seo).toBeDefined();
      expect(result.tierFeatures.visual_analysis).toBeDefined();
      expect(result.tierFeatures.detailed_recommendations).toBeDefined();
      expect(result.metadata?.toolsUsed).toEqual(['firecrawl', 'playwright', 'dataforseo']);
    });
  });

  describe('Elite Report Generation', () => {
    beforeEach(() => {
      mockJob.data!.reportTier = 'elite';
    });

    it('should complete elite report with comprehensive analysis', async () => {
      // Mock comprehensive analysis response
      mockQuery.mockResolvedValue({
        strategic_overview: {
          market_position: 'Strong competitive position',
          growth_opportunities: ['Enterprise market expansion', 'International SEO'],
        },
        enterprise_technical_seo: { score: 92 },
        competitive_intelligence: { score: 88 },
        implementation_roadmap: {
          phase_1: 'Foundation building',
          phase_2: 'Strategic implementation',
          phase_3: 'Advanced optimization',
        },
      });

      const { processReport } = await import('@/lib/workers/report-worker');
      
      const result = await processReport(mockJob as Job<ReportJobData>);

      // Verify Elite tier features
      expect(result.tierFeatures.comprehensive_audit).toBeDefined();
      expect(result.tierFeatures.strategic_insights).toBeDefined();
      expect(result.tierFeatures.implementation_roadmap).toBeDefined();
      expect(result.tierFeatures.roi_projections).toBeDefined();
    });
  });

  describe('Tasklist Pro Report Generation', () => {
    beforeEach(() => {
      mockJob.data!.reportTier = 'tasklist_pro';
    });

    it('should complete tasklist pro with actionable tasks', async () => {
      // Mock executive-level analysis with tasks
      mockQuery.mockResolvedValue({
        executive_summary: 'Executive analysis complete',
        actionable_tasks: {
          critical_tasks: [
            {
              task_id: 'task-001',
              title: 'Optimize Core Web Vitals',
              priority: 'Critical',
              effort_estimate: '2 weeks',
              roi_estimate: 25,
            },
          ],
          high_priority_tasks: [
            {
              task_id: 'task-002',
              title: 'Implement structured data',
              priority: 'High',
              effort_estimate: '1 week',
              roi_estimate: 15,
            },
          ],
        },
        implementation_roadmap: {
          phase_1_immediate: {
            duration: 'Weeks 1-4',
            tasks: ['task-001'],
          },
        },
      });

      const { processReport } = await import('@/lib/workers/report-worker');
      
      const result = await processReport(mockJob as Job<ReportJobData>);

      // Verify Tasklist Pro features
      expect(result.tierFeatures.executive_summary).toBeDefined();
      expect(result.tierFeatures.prioritized_tasks).toBeDefined();
      expect(result.tierFeatures.implementation_timeline).toBeDefined();
      expect(result.tierFeatures.resource_requirements).toBeDefined();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle worker crashes gracefully', async () => {
      // Mock severe error that would crash worker
      mockQuery.mockImplementation(() => {
        throw new Error('Out of memory');
      });

      const { processReport } = await import('@/lib/workers/report-worker');
      
      const result = await processReport(mockJob as Job<ReportJobData>);

      // Should still return a result with error information
      expect(result.domain).toBe('example.com');
      expect(result.metadata?.analysisType).toBe('fallback');
    });

    it('should handle database connection issues', async () => {
      // Mock database failure
      mockDb.update.mockRejectedValue(new Error('Database connection lost'));

      const { processReport } = await import('@/lib/workers/report-worker');
      
      // Should handle gracefully without throwing
      await expect(processReport(mockJob as Job<ReportJobData>)).resolves.toBeDefined();
    });

    it('should handle progress tracking failures', async () => {
      // Mock progress tracking failure
      mockJob.updateProgress = jest.fn().mockRejectedValue(new Error('Progress update failed'));

      mockQuery.mockResolvedValue({ score: 75 });

      const { processReport } = await import('@/lib/workers/report-worker');
      
      // Should still complete successfully
      const result = await processReport(mockJob as Job<ReportJobData>);
      expect(result.domain).toBe('example.com');
    });
  });

  describe('Performance and Timing', () => {
    it('should complete lite reports within time limits', async () => {
      mockQuery.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ score: 75 }), 50)
        )
      );

      const { processReport } = await import('@/lib/workers/report-worker');
      
      const startTime = Date.now();
      await processReport(mockJob as Job<ReportJobData>);
      const duration = Date.now() - startTime;

      // Should complete well under the 3-minute target for Lite
      expect(duration).toBeLessThan(180000); // 3 minutes
    });

    it('should track processing time accurately', async () => {
      mockQuery.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ score: 75 }), 100)
        )
      );

      const { processReport } = await import('@/lib/workers/report-worker');
      
      const result = await processReport(mockJob as Job<ReportJobData>);

      expect(result.metadata?.processingTime).toBeGreaterThan(100);
      expect(result.metadata?.processingTime).toBeLessThan(5000);
    });
  });
});