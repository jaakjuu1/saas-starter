/**
 * QA Agent
 *
 * Quality Assurance Specialist reviewing reports for excellence.
 */

import { createAgent } from '../base-agent';
import { getQAPrompt } from '../../prompts/agent-prompts';
import type { FinalReport, ReportTier } from '../../types/agent-types';

export interface QAInput {
  report: FinalReport;
  tier: ReportTier;
}

export interface QAResult {
  approved: boolean;
  qualityScore: number;
  issues?: string[];
  feedback?: string;
  recommendations?: string[];
}

/**
 * Create a QA agent with tier-specific requirements
 */
export function createQAAgent(tier: ReportTier) {
  return createAgent<QAInput, QAResult>({
    name: 'QA Agent',
    role: 'qa',
    description: 'Quality Assurance Specialist',
    systemPrompt: getQAPrompt(tier),
    temperature: 0.5, // Lower temperature for more consistent QA
    maxTokens: 3000,
  });
}
