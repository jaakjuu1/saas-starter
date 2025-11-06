/**
 * Strategic Planning Agent
 *
 * Senior SEO Strategy Consultant with MBA-level business acumen.
 */

import { createAgent } from '../base-agent';
import { STRATEGIC_PLANNING_AGENT_PROMPT } from '../../prompts/agent-prompts';
import type { StrategicAnalysis, SpecialistAnalysis, CollectedData } from '../../types/agent-types';

export interface StrategicInput {
  domain: string;
  tier: string;
  collectedData: CollectedData;
  specialistAnalysis: Partial<SpecialistAnalysis>;
  businessContext?: string;
}

export const strategicAgent = createAgent<StrategicInput, StrategicAnalysis>({
  name: 'Strategic Planning Agent',
  role: 'strategic',
  description: 'Senior SEO Strategy Consultant with executive advisory experience',
  systemPrompt: STRATEGIC_PLANNING_AGENT_PROMPT,
  temperature: 0.7,
  maxTokens: 5000, // More tokens for comprehensive strategic planning
});
