/**
 * SEO Technical Agent
 *
 * Senior Technical SEO Consultant specializing in advanced technical audits.
 */

import { createAgent } from '../base-agent';
import { SEO_TECHNICAL_AGENT_PROMPT } from '../../prompts/agent-prompts';
import type { SEOTechnicalAnalysis, WebsiteContent, SEOMetrics } from '../../types/agent-types';

export interface SEOTechnicalInput {
  domain: string;
  tier: string;
  websiteData: WebsiteContent;
  seoMetrics: SEOMetrics;
}

export const seoTechnicalAgent = createAgent<SEOTechnicalInput, SEOTechnicalAnalysis>({
  name: 'SEO Technical Agent',
  role: 'seo-technical',
  description: 'Senior Technical SEO Consultant with 10+ years experience',
  systemPrompt: SEO_TECHNICAL_AGENT_PROMPT,
  temperature: 0.7,
  maxTokens: 4000,
});
