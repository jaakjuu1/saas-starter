/**
 * Multi-Agent System Type Definitions
 *
 * This file defines all types for the multi-agent report generation system.
 */

import { z } from 'zod';

// ============================================================================
// Report Tiers
// ============================================================================

export type ReportTier = 'lite' | 'pro' | 'elite' | 'tasklist-pro';

// ============================================================================
// Agent Roles
// ============================================================================

export type AgentRole =
  | 'orchestrator'
  | 'web-crawler'
  | 'seo-metrics'
  | 'screenshot'
  | 'seo-technical'
  | 'content-strategy'
  | 'ux-design'
  | 'competitor'
  | 'strategic'
  | 'tasklist'
  | 'editor'
  | 'qa';

// ============================================================================
// Agent Configuration
// ============================================================================

export interface AgentConfig {
  name: string;
  role: AgentRole;
  description: string;
  systemPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  outputSchema?: z.ZodSchema;
}

export interface AgentResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    agentName: string;
    agentRole: AgentRole;
    executionTime: number;
    tokensUsed?: number;
  };
}

// ============================================================================
// Data Collection Types
// ============================================================================

export interface WebsiteContent {
  url: string;
  title?: string;
  description?: string;
  content?: string;
  markdown?: string;
  links?: string[];
  images?: string[];
  metadata?: {
    structure_score?: number;
    content_quality?: string;
    accessibility_score?: number;
    mobile_responsive?: boolean;
    [key: string]: any;
  };
  error?: string;
}

export interface SEOMetrics {
  domain: string;
  metrics?: {
    domainAuthority?: number;
    pageAuthority?: number;
    backlinks?: number;
    organicTraffic?: number;
    keywords?: number;
    loadTime?: number;
    mobileScore?: number;
    desktopScore?: number;
  };
  keywords?: Array<{
    keyword: string;
    position: number;
    volume: number;
    difficulty?: number;
  }>;
  competitors?: string[];
  technicalIssues?: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    count?: number;
  }>;
  error?: string;
}

export interface Screenshot {
  url: string;
  type: 'desktop' | 'mobile' | 'tablet';
  viewport?: { width: number; height: number };
  path?: string;
  base64?: string;
  analysis?: {
    visualHierarchy?: string;
    colorScheme?: string;
    brandingConsistency?: string;
    uxObservations?: string[];
  };
  error?: string;
}

export interface CompetitorData {
  domain: string;
  analysis?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  metrics?: SEOMetrics['metrics'];
  keywords?: SEOMetrics['keywords'];
  contentStrategy?: {
    topTopics: string[];
    contentGaps: string[];
    strengthAreas: string[];
  };
  error?: string;
}

// ============================================================================
// Specialist Analysis Types
// ============================================================================

export interface RecommendationBase {
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
}

export interface SEOTechnicalAnalysis {
  healthScore: number;
  findings: {
    coreWebVitals?: {
      lcp: { score: number; analysis: string; recommendations: string[] };
      fid: { score: number; analysis: string; recommendations: string[] };
      cls: { score: number; analysis: string; recommendations: string[] };
    };
    crawlability?: {
      score: number;
      robotsTxt: string;
      sitemap: string;
      issues: Array<{ severity: string; description: string; fix: string }>;
    };
    schema?: {
      currentImplementation: string[];
      missingSchemas: string[];
      recommendations: string[];
    };
    mobileOptimization?: {
      score: number;
      issues: string[];
      recommendations: string[];
    };
    [key: string]: any;
  };
  criticalIssues: Array<RecommendationBase & { solution: string }>;
  recommendations: RecommendationBase[];
}

export interface ContentStrategyAnalysis {
  contentAudit: {
    totalPages: number;
    contentQuality: { excellent: number; good: number; poor: number };
    topicCoverage: string[];
    missingTopics: string[];
  };
  contentGaps: Array<{
    topic: string;
    searchVolume: number;
    difficulty: string;
    competitorCoverage: string;
    opportunity: string;
    contentType: string;
  }>;
  topicClusters: Array<{
    pillarTopic: string;
    supportingTopics: string[];
    currentCoverage: string;
    competitiveAdvantage: string;
  }>;
  keywordOpportunities: Array<{
    keyword: string;
    volume: number;
    difficulty: number;
    intent: 'informational' | 'navigational' | 'commercial' | 'transactional';
    currentRanking?: number;
    competitorRankings: number[];
    priority: 'high' | 'medium' | 'low';
  }>;
  recommendations: Array<{
    type: 'create' | 'optimize' | 'update' | 'delete';
    title: string;
    rationale: string;
    expectedImpact: string;
    priority: number;
  }>;
}

export interface UXDesignAnalysis {
  healthScore: number;
  visualHierarchy: {
    score: number;
    analysis: string;
    recommendations: string[];
  };
  conversionOptimization: {
    score: number;
    ctaAnalysis: string;
    formOptimization: string;
    trustSignals: string[];
    opportunities: string[];
  };
  accessibility: {
    score: number;
    wcagCompliance: string;
    issues: string[];
    recommendations: string[];
  };
  mobileExperience: {
    score: number;
    analysis: string;
    issues: string[];
    recommendations: string[];
  };
  recommendations: RecommendationBase[];
}

export interface CompetitorAnalysis {
  positioningMap: {
    yourPosition: string;
    competitorPositions: Array<{ domain: string; position: string }>;
  };
  competitiveGaps: Array<{
    area: string;
    yourStrength: string;
    competitorStrength: string;
    opportunity: string;
  }>;
  marketOpportunities: string[];
  competitiveThreats: string[];
  differentiationStrategy: string[];
  recommendations: RecommendationBase[];
}

export interface StrategicAnalysis {
  executiveSummary: string;
  strategicObjectives: Array<{
    objective: string;
    timeframe: string;
    kpis: string[];
    expectedOutcome: string;
  }>;
  implementationRoadmap: {
    phase1: { title: string; duration: string; actions: string[]; expectedResults: string };
    phase2: { title: string; duration: string; actions: string[]; expectedResults: string };
    phase3: { title: string; duration: string; actions: string[]; expectedResults: string };
  };
  resourceRequirements: {
    team: string[];
    budget: string;
    tools: string[];
  };
  roiProjections: {
    trafficIncrease: string;
    conversionImprovement: string;
    revenueImpact: string;
  };
  riskAssessment: {
    risks: Array<{ risk: string; probability: string; impact: string; mitigation: string }>;
  };
  recommendations: RecommendationBase[];
}

// ============================================================================
// Final Report Types
// ============================================================================

export interface FinalReport {
  metadata: {
    domain: string;
    tier: ReportTier;
    reportId: string;
    generatedAt: string;
    overallScore: number;
    executionEngine: string;
    processingTime: number;
    agentsUsed: AgentRole[];
  };
  executiveSummary: {
    overview: string;
    keyFindings: string[];
    criticalActions: string[];
    expectedOutcome: string;
  };
  websiteHealthScore: {
    overall: number;
    technical: number;
    content: number;
    ux: number;
    competitive: number;
  };
  detailedFindings: {
    technical?: SEOTechnicalAnalysis;
    content?: ContentStrategyAnalysis;
    ux?: UXDesignAnalysis;
    competitive?: CompetitorAnalysis;
    strategic?: StrategicAnalysis;
  };
  prioritizedRecommendations: Array<RecommendationBase & {
    rank: number;
    category: string;
    expectedResults: string;
    implementation: string;
  }>;
  implementationRoadmap?: {
    phase1: { title: string; duration: string; actions: string[]; expectedResults: string };
    phase2: { title: string; duration: string; actions: string[]; expectedResults: string };
    phase3?: { title: string; duration: string; actions: string[]; expectedResults: string };
  };
  roiProjections?: {
    trafficIncrease: string;
    conversionImprovement: string;
    revenueImpact: string;
    investmentRequired: string;
  };
  qaValidation?: {
    approved: boolean;
    qualityScore: number;
    issues?: string[];
    notes?: string;
  };
}

// ============================================================================
// Orchestrator Types
// ============================================================================

export interface CollectedData {
  websiteContent: WebsiteContent;
  seoMetrics: SEOMetrics;
  screenshots: Screenshot[] | null;
  competitors: CompetitorData[] | null;
}

export interface SpecialistAnalysis {
  seoTechnical: SEOTechnicalAnalysis;
  contentStrategy: ContentStrategyAnalysis | null;
  uxDesign: UXDesignAnalysis | null;
  competitor: CompetitorAnalysis | null;
  strategic: StrategicAnalysis | null;
}

export interface OrchestratorConfig {
  domain: string;
  tier: ReportTier;
  reportId: string;
  progressCallback?: (progress: number, message: string, stage: string) => Promise<void>;
}

// ============================================================================
// Tier Configuration
// ============================================================================

export interface TierConfig {
  agents: {
    dataCollection: AgentRole[];
    specialists: AgentRole[];
    synthesis: AgentRole[];
  };
  analysisDepth: 'basic' | 'standard' | 'advanced' | 'comprehensive';
  maxExecutionTime: number; // milliseconds
  features: string[];
  targetCompletionTime: number; // seconds
}

export const TIER_CONFIGS: Record<ReportTier, TierConfig> = {
  lite: {
    agents: {
      dataCollection: ['web-crawler', 'seo-metrics'],
      specialists: ['seo-technical'],
      synthesis: ['editor', 'qa']
    },
    analysisDepth: 'basic',
    maxExecutionTime: 180000, // 3 minutes
    features: ['seo_audit', 'quick_wins', 'meta_analysis'],
    targetCompletionTime: 180
  },
  pro: {
    agents: {
      dataCollection: ['web-crawler', 'seo-metrics', 'screenshot'],
      specialists: ['seo-technical', 'content-strategy', 'ux-design', 'competitor'],
      synthesis: ['editor', 'qa']
    },
    analysisDepth: 'standard',
    maxExecutionTime: 360000, // 6 minutes
    features: ['seo_audit', 'visual_analysis', 'competitor_insights', 'content_optimization'],
    targetCompletionTime: 360
  },
  elite: {
    agents: {
      dataCollection: ['web-crawler', 'seo-metrics', 'screenshot'],
      specialists: ['seo-technical', 'content-strategy', 'ux-design', 'competitor', 'strategic'],
      synthesis: ['editor', 'qa']
    },
    analysisDepth: 'advanced',
    maxExecutionTime: 720000, // 12 minutes
    features: [
      'seo_audit',
      'visual_analysis',
      'competitor_insights',
      'content_optimization',
      'strategic_planning',
      'market_positioning',
      'roi_projections'
    ],
    targetCompletionTime: 720
  },
  'tasklist-pro': {
    agents: {
      dataCollection: ['web-crawler', 'seo-metrics', 'screenshot'],
      specialists: ['seo-technical', 'content-strategy', 'ux-design', 'competitor', 'strategic', 'tasklist'],
      synthesis: ['editor', 'qa']
    },
    analysisDepth: 'comprehensive',
    maxExecutionTime: 600000, // 10 minutes
    features: [
      'seo_audit',
      'visual_analysis',
      'competitor_insights',
      'content_optimization',
      'strategic_planning',
      'market_positioning',
      'roi_projections',
      'actionable_tasks',
      'priority_matrix',
      'export_integrations'
    ],
    targetCompletionTime: 600
  }
};
