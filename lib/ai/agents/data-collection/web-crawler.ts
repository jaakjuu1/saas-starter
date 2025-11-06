/**
 * Web Crawler Agent
 *
 * Specializes in website content extraction and structure analysis.
 */

import { createAgent } from '../base-agent';
import { WEB_CRAWLER_PROMPT } from '../../prompts/agent-prompts';
import type { WebsiteContent, ReportTier } from '../../types/agent-types';

export interface WebCrawlerInput {
  url: string;
  tier: ReportTier;
}

export const webCrawlerAgent = createAgent<WebCrawlerInput, WebsiteContent>({
  name: 'Web Crawler Agent',
  role: 'web-crawler',
  description: 'Web Crawling Specialist',
  systemPrompt: WEB_CRAWLER_PROMPT,
  temperature: 0.7,
  maxTokens: 3000,
});
