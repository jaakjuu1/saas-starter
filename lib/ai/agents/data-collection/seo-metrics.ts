/**
 * SEO Metrics Agent
 *
 * Specializes in technical SEO data collection and metrics analysis.
 */

import { createAgent } from '../base-agent';
import { SEO_METRICS_PROMPT } from '../../prompts/agent-prompts';
import type { SEOMetrics, ReportTier } from '../../types/agent-types';

export interface SEOMetricsInput {
  domain: string;
  tier: ReportTier;
}

export const seoMetricsAgent = createAgent<SEOMetricsInput, SEOMetrics>({
  name: 'SEO Metrics Agent',
  role: 'seo-metrics',
  description: 'Technical SEO Data Analyst',
  systemPrompt: SEO_METRICS_PROMPT,
  temperature: 0.7,
  maxTokens: 3000,
});
