/**
 * Report Orchestrator
 *
 * Coordinates the multi-agent workflow for report generation.
 * Manages data collection, specialist analysis, synthesis, and QA.
 */

import { webCrawlerAgent } from './data-collection/web-crawler';
import { seoMetricsAgent } from './data-collection/seo-metrics';
import { screenshotAgent } from './data-collection/screenshot';
import { seoTechnicalAgent } from './specialists/seo-technical';
import { contentStrategyAgent } from './specialists/content-strategy';
import { uxDesignAgent } from './specialists/ux-design';
import { competitorAgent } from './specialists/competitor';
import { strategicAgent } from './specialists/strategic';
import { createEditorAgent } from './synthesis/editor';
import { createQAAgent } from './synthesis/qa';

import type {
  ReportTier,
  OrchestratorConfig,
  CollectedData,
  SpecialistAnalysis,
  FinalReport,
  TIER_CONFIGS,
  CompetitorData,
} from '../types/agent-types';

export class ReportOrchestrator {
  private config: OrchestratorConfig;
  private tierConfig: typeof TIER_CONFIGS[ReportTier];

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.tierConfig = (TIER_CONFIGS as any)[config.tier];
  }

  /**
   * Main entry point: Generate complete report
   */
  async generateReport(): Promise<FinalReport> {
    const startTime = Date.now();

    try {
      console.log(`[Orchestrator] Starting ${this.config.tier} tier report for ${this.config.domain}`);

      // Phase 1: Data Collection (0-30%)
      await this.updateProgress(5, 'Initializing report generation...', 'initialization');
      const collectedData = await this.collectData();
      await this.updateProgress(30, 'Data collection complete', 'data_collection');

      // Phase 2: Specialist Analysis (30-80%) - PARALLEL EXECUTION
      await this.updateProgress(35, 'Activating specialist agents...', 'specialist_analysis');
      const specialistAnalysis = await this.runSpecialistAnalysis(collectedData);
      await this.updateProgress(80, 'Specialist analysis complete', 'specialist_analysis');

      // Phase 3: Report Synthesis (80-95%)
      await this.updateProgress(85, 'Synthesizing findings into report...', 'synthesis');
      const draftReport = await this.synthesizeReport(specialistAnalysis, collectedData);
      await this.updateProgress(90, 'Draft report complete', 'synthesis');

      // Phase 4: Quality Assurance (95-100%)
      await this.updateProgress(95, 'Running quality assurance...', 'qa');
      const finalReport = await this.qualityAssurance(draftReport);
      await this.updateProgress(100, 'Report generation complete', 'completed');

      const processingTime = Date.now() - startTime;
      console.log(`[Orchestrator] Report completed in ${Math.round(processingTime / 1000)}s`);

      // Add processing time to metadata
      finalReport.metadata.processingTime = processingTime;

      return finalReport;

    } catch (error) {
      console.error('[Orchestrator] Error generating report:', error);
      throw error;
    }
  }

  /**
   * Phase 1: Data Collection (Parallel)
   */
  private async collectData(): Promise<CollectedData> {
    console.log('[Orchestrator] Phase 1: Data Collection');

    const tasks = [];

    // Web crawler (all tiers)
    console.log('[Orchestrator] Starting web crawler...');
    tasks.push(
      webCrawlerAgent.analyze({ url: this.config.domain, tier: this.config.tier })
        .then(result => ({ websiteContent: result.data }))
    );

    // SEO metrics (all tiers)
    console.log('[Orchestrator] Starting SEO metrics collection...');
    tasks.push(
      seoMetricsAgent.analyze({ domain: this.config.domain, tier: this.config.tier })
        .then(result => ({ seoMetrics: result.data }))
    );

    // Screenshots (Pro+ only)
    if (['pro', 'elite', 'tasklist-pro'].includes(this.config.tier)) {
      console.log('[Orchestrator] Starting screenshot capture...');
      tasks.push(
        screenshotAgent.analyze({ url: this.config.domain })
          .then(result => ({ screenshots: result.data }))
      );
    } else {
      tasks.push(Promise.resolve({ screenshots: null }));
    }

    // Competitor data (Pro+ only) - placeholder for now
    if (['pro', 'elite', 'tasklist-pro'].includes(this.config.tier)) {
      // TODO: Implement real competitor analysis
      tasks.push(Promise.resolve({ competitors: null }));
    } else {
      tasks.push(Promise.resolve({ competitors: null }));
    }

    // Run all data collection in parallel
    const results = await Promise.all(tasks);

    // Merge results
    const collectedData: CollectedData = {
      websiteContent: (results[0] as any).websiteContent || {
        url: this.config.domain,
        error: 'Failed to collect website content'
      },
      seoMetrics: (results[1] as any).seoMetrics || {
        domain: this.config.domain,
        error: 'Failed to collect SEO metrics'
      },
      screenshots: (results[2] as any).screenshots || null,
      competitors: (results[3] as any).competitors || null,
    };

    console.log('[Orchestrator] Data collection complete');
    return collectedData;
  }

  /**
   * Phase 2: Specialist Analysis (Parallel)
   */
  private async runSpecialistAnalysis(data: CollectedData): Promise<SpecialistAnalysis> {
    console.log('[Orchestrator] Phase 2: Specialist Analysis');

    const specialists = this.getSpecialistsForTier();
    const tasks: Promise<any>[] = [];

    // SEO Technical (all tiers)
    if (specialists.includes('seo-technical')) {
      console.log('[Orchestrator] Starting SEO Technical Agent...');
      tasks.push(
        seoTechnicalAgent.analyze({
          domain: this.config.domain,
          tier: this.config.tier,
          websiteData: data.websiteContent,
          seoMetrics: data.seoMetrics,
        }).then(result => ({ seoTechnical: result.data }))
      );
    }

    // Content Strategy (Pro+)
    if (specialists.includes('content-strategy')) {
      console.log('[Orchestrator] Starting Content Strategy Agent...');
      tasks.push(
        contentStrategyAgent.analyze({
          domain: this.config.domain,
          websiteContent: data.websiteContent,
          competitors: data.competitors,
          seoMetrics: data.seoMetrics,
        }).then(result => ({ contentStrategy: result.data }))
      );
    }

    // UX/Design (Pro+)
    if (specialists.includes('ux-design')) {
      console.log('[Orchestrator] Starting UX/Design Agent...');
      tasks.push(
        uxDesignAgent.analyze({
          domain: this.config.domain,
          screenshots: data.screenshots,
          websiteContent: data.websiteContent,
        }).then(result => ({ uxDesign: result.data }))
      );
    }

    // Competitor Analysis (Pro+)
    if (specialists.includes('competitor') && data.competitors && data.competitors.length > 0) {
      console.log('[Orchestrator] Starting Competitor Agent...');
      tasks.push(
        competitorAgent.analyze({
          domain: this.config.domain,
          competitors: data.competitors,
          seoMetrics: data.seoMetrics,
        }).then(result => ({ competitor: result.data }))
      );
    }

    // Strategic Planning (Elite only)
    // Note: This runs AFTER other specialists, so not in parallel
    let strategicAnalysisData = null;
    if (specialists.includes('strategic')) {
      console.log('[Orchestrator] Strategic Agent will run after specialists complete...');
    }

    // Run all specialists in PARALLEL
    console.log(`[Orchestrator] Running ${tasks.length} specialist agents in parallel...`);
    const results = await Promise.all(tasks);

    // Merge results
    const analysis: SpecialistAnalysis = {
      seoTechnical: null as any,
      contentStrategy: null,
      uxDesign: null,
      competitor: null,
      strategic: null,
    };

    for (const result of results) {
      Object.assign(analysis, result);
    }

    // Now run Strategic Agent if needed (uses outputs from other specialists)
    if (specialists.includes('strategic')) {
      console.log('[Orchestrator] Starting Strategic Planning Agent...');
      const strategicResult = await strategicAgent.analyze({
        domain: this.config.domain,
        tier: this.config.tier,
        collectedData: data,
        specialistAnalysis: analysis,
      });
      analysis.strategic = strategicResult.data || null;
    }

    console.log('[Orchestrator] Specialist analysis complete');
    return analysis;
  }

  /**
   * Phase 3: Report Synthesis
   */
  private async synthesizeReport(
    analysis: SpecialistAnalysis,
    data: CollectedData
  ): Promise<FinalReport> {
    console.log('[Orchestrator] Phase 3: Report Synthesis');

    const editorAgent = createEditorAgent(this.config.tier);

    const editorResult = await editorAgent.analyze({
      domain: this.config.domain,
      tier: this.config.tier,
      specialistAnalysis: analysis,
      reportId: this.config.reportId,
    });

    if (!editorResult.success || !editorResult.data) {
      throw new Error('Editor agent failed to synthesize report');
    }

    console.log('[Orchestrator] Report synthesis complete');
    return editorResult.data;
  }

  /**
   * Phase 4: Quality Assurance
   */
  private async qualityAssurance(draftReport: FinalReport): Promise<FinalReport> {
    console.log('[Orchestrator] Phase 4: Quality Assurance');

    const qaAgent = createQAAgent(this.config.tier);

    const qaResult = await qaAgent.analyze({
      report: draftReport,
      tier: this.config.tier,
    });

    if (!qaResult.success) {
      console.warn('[Orchestrator] QA agent failed, proceeding with draft');
      return draftReport;
    }

    const qaData = qaResult.data;

    // Add QA validation to report
    const finalReport: FinalReport = {
      ...draftReport,
      qaValidation: {
        approved: qaData?.approved || false,
        qualityScore: qaData?.qualityScore || 0,
        issues: qaData?.issues,
        notes: qaData?.feedback,
      },
    };

    if (qaData?.approved) {
      console.log(`[Orchestrator] QA approved with score ${qaData.qualityScore}/100`);
    } else {
      console.warn('[Orchestrator] QA found issues:', qaData?.issues);
    }

    return finalReport;
  }

  /**
   * Get specialist agents for current tier
   */
  private getSpecialistsForTier(): string[] {
    return this.tierConfig.agents.specialists;
  }

  /**
   * Update progress via callback
   */
  private async updateProgress(progress: number, message: string, stage: string): Promise<void> {
    if (this.config.progressCallback) {
      await this.config.progressCallback(progress, message, stage);
    }
    console.log(`[Orchestrator] Progress: ${progress}% - ${stage}: ${message}`);
  }
}

/**
 * Convenience function to generate a report
 */
export async function generateReport(config: OrchestratorConfig): Promise<FinalReport> {
  const orchestrator = new ReportOrchestrator(config);
  return orchestrator.generateReport();
}
