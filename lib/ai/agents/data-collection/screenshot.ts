/**
 * Screenshot Agent
 *
 * Specializes in visual design capture and initial UX observations.
 */

import { createAgent } from '../base-agent';
import { SCREENSHOT_PROMPT } from '../../prompts/agent-prompts';
import type { Screenshot } from '../../types/agent-types';

export interface ScreenshotInput {
  url: string;
}

export const screenshotAgent = createAgent<ScreenshotInput, Screenshot[]>({
  name: 'Screenshot Agent',
  role: 'screenshot',
  description: 'Visual Design Analyst',
  systemPrompt: SCREENSHOT_PROMPT,
  temperature: 0.7,
  maxTokens: 2000,
});
