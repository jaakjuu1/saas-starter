/**
 * Multi-Agent System Exports
 *
 * Central export point for all agents in the system.
 */

// Base agent
export { Agent, createAgent } from './base-agent';

// Data collection agents
export { webCrawlerAgent } from './data-collection/web-crawler';
export { seoMetricsAgent } from './data-collection/seo-metrics';
export { screenshotAgent } from './data-collection/screenshot';

// Specialist agents
export { seoTechnicalAgent } from './specialists/seo-technical';
export { contentStrategyAgent } from './specialists/content-strategy';
export { uxDesignAgent } from './specialists/ux-design';
export { competitorAgent } from './specialists/competitor';
export { strategicAgent } from './specialists/strategic';

// Synthesis agents
export { createEditorAgent } from './synthesis/editor';
export { createQAAgent } from './synthesis/qa';

// Orchestrator
export { ReportOrchestrator, generateReport } from './orchestrator';

// Types
export type * from '../types/agent-types';
