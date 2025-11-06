/**
 * UX/Design Agent
 *
 * Senior UX Designer and CRO Specialist.
 */

import { createAgent } from '../base-agent';
import { UX_DESIGN_AGENT_PROMPT } from '../../prompts/agent-prompts';
import type { UXDesignAnalysis, Screenshot, WebsiteContent } from '../../types/agent-types';

export interface UXDesignInput {
  domain: string;
  screenshots: Screenshot[] | null;
  websiteContent: WebsiteContent;
}

export const uxDesignAgent = createAgent<UXDesignInput, UXDesignAnalysis>({
  name: 'UX/Design Agent',
  role: 'ux-design',
  description: 'Senior UX Designer & CRO Specialist',
  systemPrompt: UX_DESIGN_AGENT_PROMPT,
  temperature: 0.7,
  maxTokens: 4000,
});
