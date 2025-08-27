/**
 * Main StateGraph for Report Generation
 * 
 * This file assembles the complete LangGraph workflow with:
 * - All nodes and parallel execution paths
 * - Conditional edges based on tier
 * - Proper synchronization points
 * - Error handling paths
 */

import { StateGraph, START, END } from '@langchain/langgraph';
import { ReportState, ReportStateAnnotation, TIER_CONFIG } from './types';
import { crawlWebsite, fetchSEOMetrics, captureScreenshots } from './nodes/data-collection';
import { analyzeCompetitors } from './nodes/competitors';
import { 
  performTechnicalAnalysis, 
  performContentAnalysis, 
  performStrategicAnalysis,
  performCompetitiveAnalysis 
} from './nodes/analysis';
import { compileReport } from './nodes/compile';
import { createPostgreSQLCheckpointSaver } from './checkpoints';

/**
 * Determine which node to execute next based on tier and progress
 */
function getNextNode(state: ReportState): string {
  const { tier, progress, websiteContent, seoMetrics, screenshots, competitorData } = state;
  const tierConfig = TIER_CONFIG[tier];
  
  console.log(`[getNextNode] Routing for ${state.domain} (${tier}), progress: ${progress}%`);
  
  // Phase 1: Initial data collection (0-30%)
  if (progress < 10) {
    return 'crawlWebsite';
  }
  
  if (progress < 30 && !seoMetrics) {
    return 'fetchSEOMetrics';
  }
  
  // Phase 2: Tier-specific data collection (30-50%)
  if (progress < 40 && tier !== 'lite' && (!screenshots || screenshots.length === 0)) {
    return 'captureScreenshots';
  }
  
  if (progress < 50 && ['pro', 'elite', 'tasklist-pro'].includes(tier) && 
      (!competitorData || competitorData.length === 0)) {
    return 'analyzeCompetitors';
  }
  
  // Phase 3: Analysis (50-90%)
  if (progress < 70 && !state.technicalAnalysis) {
    return 'performTechnicalAnalysis';
  }
  
  if (progress < 80 && ['pro', 'elite', 'tasklist-pro'].includes(tier) && !state.contentAnalysis) {
    return 'performContentAnalysis';
  }
  
  if (progress < 85 && ['elite', 'tasklist-pro'].includes(tier) && !state.strategicAnalysis) {
    return 'performStrategicAnalysis';
  }
  
  if (progress < 90 && ['elite', 'tasklist-pro'].includes(tier) && !state.competitiveAnalysis) {
    return 'performCompetitiveAnalysis';
  }
  
  // Phase 4: Final compilation (90-100%)
  if (progress < 100) {
    return 'compileReport';
  }
  
  return END;
}

/**
 * Check if we should continue to next phase or end
 */
function shouldContinue(state: ReportState): string {
  const { progress, tier, endTime } = state;
  
  // If we've reached 100% or have an end time, we're done
  if (progress >= 100 || endTime) {
    console.log(`[shouldContinue] Ending: progress=${progress}%, endTime=${endTime ? 'set' : 'not set'}`);
    return END;
  }
  
  // Check if we've exceeded max execution time for tier
  const maxTime = TIER_CONFIG[tier].maxExecutionTime;
  const currentTime = Date.now();
  const startTime = state.startTime || currentTime;
  
  if (currentTime - startTime > maxTime) {
    console.log(`[shouldContinue] Timeout reached for ${tier} tier: ${currentTime - startTime}ms > ${maxTime}ms`);
    return 'compileReport'; // Force compilation on timeout
  }
  
  // Continue with routing logic
  return 'route_next';
}

/**
 * Error handling node for failed nodes
 */
async function handleError(state: ReportState): Promise<Partial<ReportState>> {
  console.log(`[handleError] Processing errors for ${state.domain}`);
  
  const { errors, tier } = state;
  const recentErrors = errors.filter(e => Date.now() - e.timestamp < 300000); // Last 5 minutes
  
  if (recentErrors.length >= 3) {
    console.log(`[handleError] Too many recent errors (${recentErrors.length}), forcing compilation`);
    return {
      progress: 95,
      progressMessage: 'Completing analysis due to multiple errors...'
    };
  }
  
  // Continue with reduced functionality
  return {
    progress: Math.min(state.progress + 10, 90),
    progressMessage: 'Continuing analysis with error recovery...'
  };
}

/**
 * Build and configure the main StateGraph
 */
export function createReportGraph(): StateGraph<ReportState> {
  console.log('[createReportGraph] Building StateGraph for report generation');
  
  const graph = new StateGraph(ReportStateAnnotation)
    // Add all nodes
    .addNode('crawlWebsite', crawlWebsite)
    .addNode('fetchSEOMetrics', fetchSEOMetrics)
    .addNode('captureScreenshots', captureScreenshots)
    .addNode('analyzeCompetitors', analyzeCompetitors)
    .addNode('performTechnicalAnalysis', performTechnicalAnalysis)
    .addNode('performContentAnalysis', performContentAnalysis)
    .addNode('performStrategicAnalysis', performStrategicAnalysis)
    .addNode('performCompetitiveAnalysis', performCompetitiveAnalysis)
    .addNode('compileReport', compileReport)
    .addNode('handleError', handleError)
    .addNode('route_next', async (state: ReportState) => {
      // This is a routing node that doesn't modify state
      return { progress: state.progress };
    })
    
    // Set entry point
    .addEdge(START, 'route_next')
    
    // Add conditional routing from route_next
    .addConditionalEdges(
      'route_next',
      getNextNode,
      {
        // Data collection nodes
        'crawlWebsite': 'crawlWebsite',
        'fetchSEOMetrics': 'fetchSEOMetrics',
        'captureScreenshots': 'captureScreenshots',
        'analyzeCompetitors': 'analyzeCompetitors',
        
        // Analysis nodes  
        'performTechnicalAnalysis': 'performTechnicalAnalysis',
        'performContentAnalysis': 'performContentAnalysis',
        'performStrategicAnalysis': 'performStrategicAnalysis',
        'performCompetitiveAnalysis': 'performCompetitiveAnalysis',
        
        // Compilation
        'compileReport': 'compileReport',
        
        // Error handling
        'handleError': 'handleError',
        
        // End
        [END]: END
      }
    )
    
    // All nodes route back to continuation check except compileReport
    .addConditionalEdges('crawlWebsite', shouldContinue, {
      'route_next': 'route_next',
      'compileReport': 'compileReport',
      [END]: END
    })
    .addConditionalEdges('fetchSEOMetrics', shouldContinue, {
      'route_next': 'route_next', 
      'compileReport': 'compileReport',
      [END]: END
    })
    .addConditionalEdges('captureScreenshots', shouldContinue, {
      'route_next': 'route_next',
      'compileReport': 'compileReport', 
      [END]: END
    })
    .addConditionalEdges('analyzeCompetitors', shouldContinue, {
      'route_next': 'route_next',
      'compileReport': 'compileReport',
      [END]: END
    })
    .addConditionalEdges('performTechnicalAnalysis', shouldContinue, {
      'route_next': 'route_next',
      'compileReport': 'compileReport',
      [END]: END
    })
    .addConditionalEdges('performContentAnalysis', shouldContinue, {
      'route_next': 'route_next',
      'compileReport': 'compileReport',
      [END]: END
    })
    .addConditionalEdges('performStrategicAnalysis', shouldContinue, {
      'route_next': 'route_next',
      'compileReport': 'compileReport',
      [END]: END
    })
    .addConditionalEdges('performCompetitiveAnalysis', shouldContinue, {
      'route_next': 'route_next',
      'compileReport': 'compileReport',
      [END]: END
    })
    .addConditionalEdges('handleError', shouldContinue, {
      'route_next': 'route_next',
      'compileReport': 'compileReport',
      [END]: END
    })
    
    // compileReport always goes to END
    .addEdge('compileReport', END);
  
  console.log('[createReportGraph] StateGraph built successfully');
  return graph;
}

/**
 * Initialize the report state with default values
 */
export function initializeReportState(
  domain: string,
  tier: 'lite' | 'pro' | 'elite' | 'tasklist-pro',
  reportId: string
): ReportState {
  return {
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
    progressMessage: 'Initializing analysis...',
    errors: [],
    retries: {},
    startTime: Date.now(),
    endTime: undefined,
    messages: [],
    checkpointId: undefined
  };
}

/**
 * Compile the graph for execution with optional checkpoint saver
 */
export function compileReportGraph(options?: {
  useCheckpointing?: boolean;
  checkpointSaver?: any;
}) {
  console.log('[compileReportGraph] Compiling StateGraph for execution');
  const graph = createReportGraph();
  
  let compiledGraph;
  
  if (options?.useCheckpointing !== false) {
    // Use PostgreSQL checkpointing by default
    const checkpointSaver = options?.checkpointSaver || createPostgreSQLCheckpointSaver();
    compiledGraph = graph.compile({ checkpointSaver });
    console.log('[compileReportGraph] Graph compiled with PostgreSQL checkpointing');
  } else {
    compiledGraph = graph.compile();
    console.log('[compileReportGraph] Graph compiled without checkpointing');
  }
  
  return compiledGraph;
}

/**
 * Execute the complete report generation workflow
 */
export async function executeReportGeneration(
  domain: string,
  tier: 'lite' | 'pro' | 'elite' | 'tasklist-pro',
  reportId: string,
  options?: {
    checkpointSaver?: any;
    configurable?: Record<string, any>;
    useCheckpointing?: boolean;
  }
): Promise<ReportState> {
  console.log(`[executeReportGeneration] Starting report generation for ${domain} (${tier})`);
  
  const compiledGraph = compileReportGraph({
    useCheckpointing: options?.useCheckpointing,
    checkpointSaver: options?.checkpointSaver
  });
  const initialState = initializeReportState(domain, tier, reportId);
  
  try {
    // Execute the graph with streaming for real-time updates
    const config = {
      configurable: {
        thread_id: reportId,
        ...options?.configurable
      },
      ...options?.checkpointSaver ? { checkpointer: options.checkpointSaver } : {}
    };
    
    console.log(`[executeReportGeneration] Invoking graph with config:`, config);
    const finalState = await compiledGraph.invoke(initialState, config);
    
    console.log(`[executeReportGeneration] Report generation completed for ${domain}`);
    return finalState;
    
  } catch (error) {
    console.error(`[executeReportGeneration] Error generating report for ${domain}:`, error);
    
    // Return a fallback final state with error information
    return {
      ...initialState,
      progress: 100,
      progressMessage: 'Report generation failed',
      endTime: Date.now(),
      errors: [
        ...initialState.errors,
        {
          node: 'executeReportGeneration',
          error: error instanceof Error ? error.message : 'Unknown execution error',
          timestamp: Date.now(),
          retryCount: 0
        }
      ],
      finalReport: {
        metadata: {
          domain,
          tier,
          reportId,
          generatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Execution failed'
        },
        executiveSummary: 'Report generation encountered critical errors and could not be completed.',
        keyFindings: { execution_error: true },
        recommendations: [
          {
            priority: 'critical' as const,
            title: 'Retry Report Generation', 
            description: 'The report generation process failed and should be retried',
            impact: 'Enables completion of website analysis',
            effort: 'high' as const,
            timeframe: 'Immediate'
          }
        ],
        error: error instanceof Error ? error.message : 'Execution failed'
      }
    };
  }
}

/**
 * Stream report generation with real-time updates
 */
export async function* streamReportGeneration(
  domain: string,
  tier: 'lite' | 'pro' | 'elite' | 'tasklist-pro',
  reportId: string,
  options?: {
    checkpointSaver?: any;
    configurable?: Record<string, any>;
    useCheckpointing?: boolean;
  }
): AsyncGenerator<ReportState, ReportState, unknown> {
  console.log(`[streamReportGeneration] Starting streaming report generation for ${domain} (${tier})`);
  
  const compiledGraph = compileReportGraph({
    useCheckpointing: options?.useCheckpointing,
    checkpointSaver: options?.checkpointSaver
  });
  const initialState = initializeReportState(domain, tier, reportId);
  
  const config = {
    configurable: {
      thread_id: reportId,
      ...options?.configurable
    },
    ...options?.checkpointSaver ? { checkpointer: options.checkpointSaver } : {}
  };
  
  try {
    // Stream the execution
    for await (const chunk of compiledGraph.stream(initialState, config)) {
      console.log(`[streamReportGeneration] Streaming update for ${domain}:`, chunk);
      yield chunk as ReportState;
    }
    
    console.log(`[streamReportGeneration] Streaming completed for ${domain}`);
    return initialState; // This will be overridden by the final state from streaming
    
  } catch (error) {
    console.error(`[streamReportGeneration] Streaming error for ${domain}:`, error);
    
    const errorState: ReportState = {
      ...initialState,
      progress: 100,
      progressMessage: 'Report generation failed during streaming',
      endTime: Date.now(),
      errors: [
        ...initialState.errors,
        {
          node: 'streamReportGeneration',
          error: error instanceof Error ? error.message : 'Unknown streaming error',
          timestamp: Date.now(),
          retryCount: 0
        }
      ]
    };
    
    yield errorState;
    return errorState;
  }
}