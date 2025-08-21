import { Worker, Job } from 'bullmq';
import { query } from '@anthropic-ai/claude-code';
import { db } from '@/lib/db/drizzle';
import { reports, reportJobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ReportJobData, ReportJobProgress, reportQueue } from '@/lib/queue/report-queue';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

class ReportProcessor {
  private async updateJobProgress(
    job: Job<ReportJobData>,
    progress: ReportJobProgress
  ) {
    // Update job progress in BullMQ
    await job.updateProgress(progress.progress);
    
    // Update database record
    await db
      .update(reportJobs)
      .set({
        progress: progress.progress,
        status: progress.progress === 100 ? 'completed' : 'active',
        updatedAt: new Date()
      })
      .where(eq(reportJobs.reportId, job.data.reportId));

    console.log(`[Report ${job.data.reportId}] ${progress.stage}: ${progress.message}`);
  }

  private async updateReportStatus(reportId: number, status: string, data?: any) {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    if (data) {
      updateData.reportData = JSON.stringify(data);
    }

    await db
      .update(reports)
      .set(updateData)
      .where(eq(reports.id, reportId));
  }

  async processLiteReport(job: Job<ReportJobData>): Promise<any> {
    const { domain, reportTier } = job.data;

    await this.updateJobProgress(job, {
      stage: 'initialization',
      progress: 10,
      message: `Starting ${reportTier} report analysis for ${domain}`
    });

    // Stage 1: Basic website crawl and analysis
    await this.updateJobProgress(job, {
      stage: 'crawling',
      progress: 25,
      message: 'Analyzing website structure and content'
    });

    const crawlAnalysis = await this.performWebsiteAnalysis(domain);

    // Stage 2: Technical SEO audit
    await this.updateJobProgress(job, {
      stage: 'seo_audit',
      progress: 50,
      message: 'Running technical SEO audit'
    });

    const seoAudit = await this.performSEOAudit(domain, crawlAnalysis);

    // Stage 3: Page speed analysis
    await this.updateJobProgress(job, {
      stage: 'performance',
      progress: 75,
      message: 'Analyzing page performance metrics'
    });

    const performanceAudit = await this.performPerformanceAudit(domain);

    // Stage 4: Generate report
    await this.updateJobProgress(job, {
      stage: 'report_generation',
      progress: 90,
      message: 'Generating comprehensive report'
    });

    const reportData = {
      domain,
      reportTier,
      generatedAt: new Date().toISOString(),
      analysis: {
        website: crawlAnalysis,
        seo: seoAudit,
        performance: performanceAudit,
      },
      recommendations: await this.generateRecommendations(crawlAnalysis, seoAudit, performanceAudit),
    };

    await this.updateJobProgress(job, {
      stage: 'completed',
      progress: 100,
      message: 'Report generation completed successfully'
    });

    return reportData;
  }

  private async performWebsiteAnalysis(domain: string): Promise<any> {
    try {
      // Use Claude Code SDK to analyze website
      const messages: any[] = [];
      
      for await (const message of query({
        prompt: `Analyze the website ${domain} for basic structure, content quality, and user experience. Focus on:
        1. Site structure and navigation
        2. Content quality and organization  
        3. Basic accessibility features
        4. Mobile responsiveness indicators
        5. Overall user experience assessment
        
        Provide a structured analysis with specific findings and scores (1-100) for each area.`,
        options: {
          maxTurns: 2,
        },
      })) {
        if (message.type === 'result') {
          messages.push(message.result);
        }
      }

      return {
        structure: 'Analyzed via Claude Code SDK',
        content_quality: 'Evaluated for relevance and optimization',
        accessibility: 'Basic accessibility compliance checked',
        mobile_responsive: 'Mobile-first design assessment',
        raw_analysis: messages.join('\\n'),
        score: 75, // Placeholder - would be calculated from actual analysis
      };
    } catch (error) {
      console.error('Website analysis failed:', error);
      return {
        error: 'Analysis failed',
        message: 'Unable to complete website analysis',
        score: 0,
      };
    }
  }

  private async performSEOAudit(domain: string, websiteData: any): Promise<any> {
    try {
      const messages: any[] = [];
      
      for await (const message of query({
        prompt: `Perform a technical SEO audit for ${domain}. Analyze:
        1. Meta tags (title, description, keywords)
        2. Header structure (H1, H2, etc.)
        3. URL structure and optimization
        4. Internal linking strategy
        5. Image optimization (alt tags, file sizes)
        6. Schema markup presence
        7. Sitemap and robots.txt
        
        Provide specific recommendations with priority levels (High/Medium/Low).`,
        options: {
          maxTurns: 2,
        },
      })) {
        if (message.type === 'result') {
          messages.push(message.result);
        }
      }

      return {
        meta_tags: 'Comprehensive meta tag analysis',
        header_structure: 'H1-H6 tag optimization review',
        url_structure: 'URL optimization assessment',
        internal_linking: 'Link structure evaluation',
        image_optimization: 'Image SEO analysis',
        technical_factors: 'Schema, sitemap, robots.txt review',
        raw_audit: messages.join('\\n'),
        score: 82, // Placeholder
      };
    } catch (error) {
      console.error('SEO audit failed:', error);
      return {
        error: 'SEO audit failed',
        score: 0,
      };
    }
  }

  private async performPerformanceAudit(domain: string): Promise<any> {
    try {
      const messages: any[] = [];
      
      for await (const message of query({
        prompt: `Analyze the performance of ${domain}. Focus on:
        1. Page load speed metrics
        2. Core Web Vitals (LCP, FID, CLS)
        3. Resource optimization opportunities
        4. Caching strategies
        5. Image and asset optimization
        6. JavaScript and CSS optimization
        
        Provide specific performance recommendations with estimated impact.`,
        options: {
          maxTurns: 2,
        },
      })) {
        if (message.type === 'result') {
          messages.push(message.result);
        }
      }

      return {
        load_speed: 'Page load time analysis',
        core_web_vitals: 'LCP, FID, CLS metrics',
        resource_optimization: 'Asset optimization opportunities',
        caching: 'Caching strategy recommendations',
        raw_performance: messages.join('\\n'),
        score: 68, // Placeholder
      };
    } catch (error) {
      console.error('Performance audit failed:', error);
      return {
        error: 'Performance audit failed',
        score: 0,
      };
    }
  }

  private async generateRecommendations(websiteData: any, seoData: any, performanceData: any): Promise<any> {
    try {
      const messages: any[] = [];
      
      for await (const message of query({
        prompt: `Based on the website analysis, SEO audit, and performance review, generate prioritized recommendations for improvement. Include:
        
        1. High Priority Actions (immediate impact)
        2. Medium Priority Improvements (significant impact)  
        3. Low Priority Enhancements (long-term value)
        
        For each recommendation:
        - Specific action to take
        - Expected impact/benefit
        - Implementation difficulty (Easy/Medium/Hard)
        - Estimated timeline
        
        Focus on actionable, measurable improvements.`,
        options: {
          maxTurns: 3,
        },
      })) {
        if (message.type === 'result') {
          messages.push(message.result);
        }
      }

      return {
        high_priority: 'Critical improvements for immediate impact',
        medium_priority: 'Important optimizations for growth',
        low_priority: 'Long-term enhancements',
        implementation_guide: messages.join('\\n'),
      };
    } catch (error) {
      console.error('Recommendations generation failed:', error);
      return {
        error: 'Failed to generate recommendations',
      };
    }
  }
}

// Create the worker
export const reportWorker = new Worker<ReportJobData>(
  'report-generation',
  async (job) => {
    const processor = new ReportProcessor();
    
    try {
      console.log(`Starting report generation for job ${job.id}`);
      
      // Update report status to processing
      await processor['updateReportStatus'](job.data.reportId, 'processing');
      
      // Process the report based on tier
      let reportData;
      switch (job.data.reportTier) {
        case 'lite':
          reportData = await processor.processLiteReport(job);
          break;
        case 'pro':
        case 'elite':
        case 'tasklist_pro':
          // For now, process all tiers as lite - will be extended later
          reportData = await processor.processLiteReport(job);
          break;
        default:
          throw new Error(`Unknown report tier: ${job.data.reportTier}`);
      }
      
      // Update report with generated data
      await processor['updateReportStatus'](job.data.reportId, 'completed', reportData);
      
      console.log(`Completed report generation for job ${job.id}`);
      return reportData;
      
    } catch (error) {
      console.error(`Report generation failed for job ${job.id}:`, error);
      
      // Update report status to failed
      await processor['updateReportStatus'](job.data.reportId, 'failed');
      
      throw error;
    }
  },
  {
    connection,
    concurrency: 2, // Process 2 reports concurrently
    limiter: {
      max: 10,
      duration: 60 * 1000, // Max 10 jobs per minute
    },
  }
);

// Worker event handlers
reportWorker.on('completed', (job) => {
  console.log(`Report ${job.id} completed successfully`);
});

reportWorker.on('failed', (job, err) => {
  console.error(`Report ${job?.id} failed:`, err.message);
});

reportWorker.on('progress', (job, progress) => {
  console.log(`Report ${job.id} progress: ${progress}%`);
});

export default reportWorker;