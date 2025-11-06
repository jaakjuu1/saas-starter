/**
 * Editor Agent
 *
 * Senior Content Editor specializing in synthesizing technical analysis
 * into compelling, actionable reports.
 */

import { createAgent } from '../base-agent';
import { getEditorPrompt, getTierTargetAudience } from '../../prompts/agent-prompts';
import type { FinalReport, SpecialistAnalysis, ReportTier } from '../../types/agent-types';

export interface EditorInput {
  domain: string;
  tier: ReportTier;
  specialistAnalysis: SpecialistAnalysis;
  reportId: string;
}

/**
 * Create an editor agent with tier-specific configuration
 */
export function createEditorAgent(tier: ReportTier) {
  const targetAudience = getTierTargetAudience(tier);

  return createAgent<EditorInput, FinalReport>({
    name: 'Editor Agent',
    role: 'editor',
    description: 'Senior Content Editor and Report Synthesizer',
    systemPrompt: getEditorPrompt(tier, targetAudience),
    temperature: 0.7,
    maxTokens: 6000, // More tokens for comprehensive report synthesis
  });
}
