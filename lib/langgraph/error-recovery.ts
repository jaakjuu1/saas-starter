/**
 * Error Recovery and Retry Logic for LangGraph Report Generation
 * 
 * This file implements retry logic for failed nodes with exponential backoff,
 * handles partial failures gracefully, maintains retry counters in state,
 * and provides checkpoint-based recovery functions.
 */

import { ReportState, ReportError } from './types';
import { executeReportGeneration, streamReportGeneration } from './report-graph';
import { createPostgreSQLCheckpointSaver, getStateAtCheckpoint } from './checkpoints';

/**
 * Retry configuration for different failure types
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  exponentialBase: number;
  jitter: boolean;
}

/**
 * Default retry configurations by error type
 */
export const DEFAULT_RETRY_CONFIGS: Record<string, RetryConfig> = {
  network_error: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    exponentialBase: 2,
    jitter: true
  },
  rate_limit: {
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 30000,
    exponentialBase: 2,
    jitter: true
  },
  api_error: {
    maxRetries: 2,
    baseDelay: 1500,
    maxDelay: 8000,
    exponentialBase: 1.5,
    jitter: true
  },
  timeout: {
    maxRetries: 2,
    baseDelay: 2000,
    maxDelay: 15000,
    exponentialBase: 2,
    jitter: false
  },
  parse_error: {
    maxRetries: 1,
    baseDelay: 1000,
    maxDelay: 5000,
    exponentialBase: 1.5,
    jitter: false
  },
  default: {
    maxRetries: 2,
    baseDelay: 1000,
    maxDelay: 10000,
    exponentialBase: 2,
    jitter: true
  }
};

/**
 * Calculate delay for exponential backoff with optional jitter
 */
function calculateDelay(
  retryCount: number,
  config: RetryConfig
): number {
  const exponentialDelay = config.baseDelay * Math.pow(config.exponentialBase, retryCount);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
  
  if (config.jitter) {
    // Add random jitter (±25% of delay)
    const jitterRange = cappedDelay * 0.25;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;
    return Math.max(0, cappedDelay + jitter);
  }
  
  return cappedDelay;
}

/**
 * Classify error type for appropriate retry strategy
 */
function classifyError(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('connection') || message.includes('econnreset')) {
    return 'network_error';
  }
  if (message.includes('rate limit') || message.includes('429') || message.includes('too many requests')) {
    return 'rate_limit';
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'timeout';
  }
  if (message.includes('parse') || message.includes('json') || message.includes('syntax')) {
    return 'parse_error';
  }
  if (message.includes('401') || message.includes('403') || message.includes('api')) {
    return 'api_error';
  }
  
  return 'default';
}

/**
 * Check if an error should be retried
 */
function shouldRetryError(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // Never retry these error types
  const nonRetryableErrors = [
    'authentication failed',
    'api key invalid',
    'unauthorized',
    'forbidden',
    'not found',
    'bad request',
    'invalid domain',
    'malformed url'
  ];
  
  return !nonRetryableErrors.some(nonRetryable => message.includes(nonRetryable));
}

/**
 * Get retry count for a specific node
 */
function getNodeRetryCount(state: ReportState, nodeName: string): number {
  return state.retries[nodeName] || 0;
}

/**
 * Update retry count for a node
 */
function updateNodeRetryCount(state: ReportState, nodeName: string): Partial<ReportState> {
  const currentCount = getNodeRetryCount(state, nodeName);
  return {
    retries: {
      ...state.retries,
      [nodeName]: currentCount + 1
    }
  };
}

/**
 * Add error to state error log
 */
function addErrorToState(
  state: ReportState,
  nodeName: string,
  error: Error,
  retryCount: number
): Partial<ReportState> {
  const reportError: ReportError = {
    node: nodeName,
    error: error.message,
    timestamp: Date.now(),
    retryCount
  };

  return {
    errors: [...state.errors, reportError]
  };
}

/**
 * Enhanced node wrapper that adds retry logic
 */
export function withRetryLogic<TState extends ReportState>(
  nodeFunction: (state: TState) => Promise<Partial<TState>>,
  nodeName: string,
  customConfig?: Partial<RetryConfig>
) {
  return async (state: TState): Promise<Partial<TState>> => {
    const retryCount = getNodeRetryCount(state, nodeName);
    
    try {
      console.log(`[${nodeName}] Executing (attempt ${retryCount + 1})`);
      
      // Execute the original node function
      const result = await nodeFunction(state);
      
      // If successful, reset retry count
      if (retryCount > 0) {
        console.log(`[${nodeName}] Succeeded after ${retryCount + 1} attempts`);
      }
      
      return result;
      
    } catch (error) {
      console.error(`[${nodeName}] Error on attempt ${retryCount + 1}:`, error);
      
      if (!(error instanceof Error)) {
        throw new Error(`Unknown error in ${nodeName}: ${String(error)}`);
      }
      
      // Check if error should be retried
      if (!shouldRetryError(error)) {
        console.log(`[${nodeName}] Non-retryable error, failing immediately`);
        throw error;
      }
      
      // Get retry configuration
      const errorType = classifyError(error);
      const config = {
        ...DEFAULT_RETRY_CONFIGS[errorType],
        ...customConfig
      };
      
      // Check if we've exceeded max retries
      if (retryCount >= config.maxRetries) {
        console.log(`[${nodeName}] Max retries (${config.maxRetries}) exceeded`);
        
        // Update state with final error
        const errorUpdate = addErrorToState(state, nodeName, error, retryCount);
        throw new Error(`${nodeName} failed after ${retryCount + 1} attempts: ${error.message}`);
      }
      
      // Calculate delay and wait
      const delay = calculateDelay(retryCount, config);
      console.log(`[${nodeName}] Retrying in ${Math.round(delay)}ms (attempt ${retryCount + 2}/${config.maxRetries + 1})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Update retry count and error state
      const retryUpdate = updateNodeRetryCount(state, nodeName);
      const errorUpdate = addErrorToState(state, nodeName, error, retryCount);
      
      // Recursively retry with updated state
      const updatedState = {
        ...state,
        ...retryUpdate,
        ...errorUpdate
      } as TState;
      
      return withRetryLogic(nodeFunction, nodeName, customConfig)(updatedState);
    }
  };
}

/**
 * Resume failed report from checkpoint
 */
export async function resumeFailedReport(
  reportId: string,
  domain: string,
  tier: 'lite' | 'pro' | 'elite' | 'tasklist-pro',
  checkpointId?: string
): Promise<ReportState> {
  console.log(`[resumeFailedReport] Resuming report ${reportId} from checkpoint ${checkpointId || 'latest'}`);
  
  try {
    const checkpointSaver = createPostgreSQLCheckpointSaver();
    
    // If no specific checkpoint, get the latest one
    let resumeCheckpointId = checkpointId;
    if (!resumeCheckpointId) {
      const checkpoints = checkpointSaver.list({
        configurable: { thread_id: reportId }
      });
      
      const firstCheckpoint = await checkpoints.next();
      if (!firstCheckpoint.done && firstCheckpoint.value) {
        resumeCheckpointId = firstCheckpoint.value.config.configurable?.checkpoint_id;
      }
    }
    
    if (!resumeCheckpointId) {
      throw new Error(`No checkpoint found for report ${reportId}`);
    }
    
    console.log(`[resumeFailedReport] Resuming from checkpoint ${resumeCheckpointId}`);
    
    // Get the state at the checkpoint
    const checkpointState = await getStateAtCheckpoint(reportId, resumeCheckpointId);
    console.log(`[resumeFailedReport] Checkpoint state progress: ${checkpointState.state.progress}%`);
    
    // Resume execution from the checkpoint
    const result = await executeReportGeneration(domain, tier, reportId, {
      configurable: {
        thread_id: reportId,
        checkpoint_id: resumeCheckpointId
      },
      checkpointSaver,
      useCheckpointing: true
    });
    
    console.log(`[resumeFailedReport] Resume completed for report ${reportId}`);
    return result;
    
  } catch (error) {
    console.error(`[resumeFailedReport] Resume failed for report ${reportId}:`, error);
    throw new Error(`Failed to resume report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Stream report generation with automatic recovery from last checkpoint
 */
export async function* streamReportWithRecovery(
  domain: string,
  tier: 'lite' | 'pro' | 'elite' | 'tasklist-pro',
  reportId: string,
  options?: {
    maxRecoveryAttempts?: number;
    recoveryDelay?: number;
  }
): AsyncGenerator<ReportState, ReportState, unknown> {
  const maxRecoveryAttempts = options?.maxRecoveryAttempts || 2;
  const recoveryDelay = options?.recoveryDelay || 5000;
  
  let recoveryAttempt = 0;
  let lastCheckpointId: string | undefined;
  
  while (recoveryAttempt <= maxRecoveryAttempts) {
    try {
      console.log(`[streamReportWithRecovery] Starting attempt ${recoveryAttempt + 1} for ${reportId}`);
      
      const streamOptions = {
        configurable: {
          thread_id: reportId,
          ...(lastCheckpointId && { checkpoint_id: lastCheckpointId })
        },
        useCheckpointing: true
      };
      
      let finalState: ReportState | undefined;
      
      for await (const state of streamReportGeneration(domain, tier, reportId, streamOptions)) {
        finalState = state;
        
        // Update last known checkpoint ID
        if (state.checkpointId) {
          lastCheckpointId = state.checkpointId;
        }
        
        yield state;
      }
      
      if (!finalState) {
        throw new Error('No final state received from stream');
      }
      
      console.log(`[streamReportWithRecovery] Successfully completed report ${reportId}`);
      return finalState;
      
    } catch (error) {
      console.error(`[streamReportWithRecovery] Attempt ${recoveryAttempt + 1} failed for ${reportId}:`, error);
      
      recoveryAttempt++;
      
      if (recoveryAttempt > maxRecoveryAttempts) {
        console.log(`[streamReportWithRecovery] Max recovery attempts (${maxRecoveryAttempts}) exceeded for ${reportId}`);
        throw error;
      }
      
      console.log(`[streamReportWithRecovery] Waiting ${recoveryDelay}ms before recovery attempt ${recoveryAttempt + 1}`);
      await new Promise(resolve => setTimeout(resolve, recoveryDelay));
      
      // Yield recovery attempt state
      yield {
        domain,
        tier,
        reportId,
        websiteContent: undefined,
        seoMetrics: undefined,
        screenshots: [],
        competitorData: [],
        technicalAnalysis: undefined,
        contentAnalysis: undefined,
        strategicAnalysis: undefined,
        competitiveAnalysis: undefined,
        finalReport: undefined,
        progress: 0,
        progressMessage: `Recovery attempt ${recoveryAttempt + 1}...`,
        errors: [],
        retries: {},
        startTime: Date.now(),
        endTime: undefined,
        messages: [],
        checkpointId: lastCheckpointId
      };
    }
  }
  
  throw new Error(`Failed to complete report after ${maxRecoveryAttempts} recovery attempts`);
}

/**
 * Clean up failed report state (remove checkpoints and reset)
 */
export async function cleanupFailedReport(reportId: string): Promise<void> {
  try {
    const checkpointSaver = createPostgreSQLCheckpointSaver();
    
    await checkpointSaver.delete({
      configurable: { thread_id: reportId }
    });
    
    console.log(`[cleanupFailedReport] Cleaned up checkpoints for report ${reportId}`);
    
  } catch (error) {
    console.error(`[cleanupFailedReport] Failed to cleanup report ${reportId}:`, error);
    throw error;
  }
}

/**
 * Get error statistics for monitoring
 */
export function getErrorStatistics(state: ReportState): {
  totalErrors: number;
  errorsByNode: Record<string, number>;
  errorsByType: Record<string, number>;
  totalRetries: number;
  retriesByNode: Record<string, number>;
} {
  const errorsByNode: Record<string, number> = {};
  const errorsByType: Record<string, number> = {};
  
  // Count errors by node
  for (const error of state.errors) {
    errorsByNode[error.node] = (errorsByNode[error.node] || 0) + 1;
    
    // Classify error type
    const errorType = classifyError(new Error(error.error));
    errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
  }
  
  // Count retries
  const totalRetries = Object.values(state.retries).reduce((sum, count) => sum + count, 0);
  
  return {
    totalErrors: state.errors.length,
    errorsByNode,
    errorsByType,
    totalRetries,
    retriesByNode: { ...state.retries }
  };
}