/**
 * Competitor Analysis Agent
 *
 * Competitive Intelligence Analyst specializing in market analysis and positioning.
 */

import { createAgent } from '../base-agent';
import { COMPETITOR_AGENT_PROMPT } from '../../prompts/agent-prompts';
import type { CompetitorAnalysis, CompetitorData, SEOMetrics } from '../../types/agent-types';

export interface CompetitorInput {
  domain: string;
  competitors: CompetitorData[];
  seoMetrics: SEOMetrics;
  industry?: string;
}

export const competitorAgent = createAgent<CompetitorInput, CompetitorAnalysis>({
  name: 'Competitor Analysis Agent',
  role: 'competitor',
  description: 'Competitive Intelligence Analyst',
  systemPrompt: COMPETITOR_AGENT_PROMPT,
  temperature: 0.7,
  maxTokens: 4000,
});
