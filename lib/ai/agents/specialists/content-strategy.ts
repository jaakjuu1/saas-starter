/**
 * Content Strategy Agent
 *
 * Senior Content Marketing Strategist specializing in SEO-driven content strategy.
 */

import { createAgent } from '../base-agent';
import { CONTENT_STRATEGY_AGENT_PROMPT } from '../../prompts/agent-prompts';
import type { ContentStrategyAnalysis, WebsiteContent, CompetitorData } from '../../types/agent-types';

export interface ContentStrategyInput {
  domain: string;
  websiteContent: WebsiteContent;
  competitors: CompetitorData[] | null;
  seoMetrics?: any;
}

export const contentStrategyAgent = createAgent<ContentStrategyInput, ContentStrategyAnalysis>({
  name: 'Content Strategy Agent',
  role: 'content-strategy',
  description: 'Senior Content Marketing Strategist',
  systemPrompt: CONTENT_STRATEGY_AGENT_PROMPT,
  temperature: 0.7,
  maxTokens: 4000,
});
