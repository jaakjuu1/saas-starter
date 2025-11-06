/**
 * Base Agent Class
 *
 * Foundation for all specialist agents in the multi-agent system.
 * Uses Vercel AI SDK with Claude for analysis.
 */

import { generateText, streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { AgentConfig, AgentResult } from '../types/agent-types';

export class Agent<TInput = any, TOutput = any> {
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Analyze input data using Claude
   */
  async analyze(input: TInput): Promise<AgentResult<TOutput>> {
    const startTime = Date.now();

    try {
      console.log(`[${this.config.name}] Starting analysis...`);

      const prompt = this.buildPrompt(input);

      const result = await generateText({
        model: anthropic(this.config.model || 'claude-3-5-sonnet-20241022'),
        system: this.config.systemPrompt,
        prompt,
        temperature: this.config.temperature ?? 0.7,
        maxTokens: this.config.maxTokens ?? 4000,
      });

      const executionTime = Date.now() - startTime;
      console.log(`[${this.config.name}] Analysis completed in ${executionTime}ms`);

      const parsedOutput = this.parseOutput(result.text);

      return {
        success: true,
        data: parsedOutput as TOutput,
        metadata: {
          agentName: this.config.name,
          agentRole: this.config.role,
          executionTime,
          tokensUsed: result.usage?.totalTokens,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`[${this.config.name}] Analysis failed:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          agentName: this.config.name,
          agentRole: this.config.role,
          executionTime,
        },
      };
    }
  }

  /**
   * Analyze with streaming support
   */
  async analyzeStreaming(input: TInput, onChunk?: (chunk: string) => void): Promise<AgentResult<TOutput>> {
    const startTime = Date.now();

    try {
      console.log(`[${this.config.name}] Starting streaming analysis...`);

      const prompt = this.buildPrompt(input);

      const result = await streamText({
        model: anthropic(this.config.model || 'claude-3-5-sonnet-20241022'),
        system: this.config.systemPrompt,
        prompt,
        temperature: this.config.temperature ?? 0.7,
        maxTokens: this.config.maxTokens ?? 4000,
      });

      // Collect stream
      let fullText = '';
      for await (const chunk of result.textStream) {
        fullText += chunk;
        if (onChunk) {
          onChunk(chunk);
        }
      }

      const executionTime = Date.now() - startTime;
      console.log(`[${this.config.name}] Streaming analysis completed in ${executionTime}ms`);

      const parsedOutput = this.parseOutput(fullText);

      return {
        success: true,
        data: parsedOutput as TOutput,
        metadata: {
          agentName: this.config.name,
          agentRole: this.config.role,
          executionTime,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`[${this.config.name}] Streaming analysis failed:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          agentName: this.config.name,
          agentRole: this.config.role,
          executionTime,
        },
      };
    }
  }

  /**
   * Build the prompt from input data
   * Override this in subclasses for custom prompt building
   */
  protected buildPrompt(input: TInput): string {
    if (typeof input === 'string') {
      return input;
    }

    // Default: JSON stringify with pretty print
    return `Analyze the following data:\n\n${JSON.stringify(input, null, 2)}`;
  }

  /**
   * Parse output text into structured data
   * Override this in subclasses for custom parsing
   */
  protected parseOutput(text: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // If we have a schema, validate against it
        if (this.config.outputSchema) {
          return this.config.outputSchema.parse(parsed);
        }

        return parsed;
      }
    } catch (error) {
      console.warn(`[${this.config.name}] JSON parsing failed, returning raw text`);
    }

    // Fallback: return structured object with raw analysis
    return {
      analysis: text,
      raw: true,
    };
  }

  /**
   * Get agent information
   */
  getInfo() {
    return {
      name: this.config.name,
      role: this.config.role,
      description: this.config.description,
    };
  }
}

/**
 * Create a specialized agent with specific configuration
 */
export function createAgent<TInput = any, TOutput = any>(
  config: AgentConfig
): Agent<TInput, TOutput> {
  return new Agent<TInput, TOutput>(config);
}
