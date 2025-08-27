import { Annotation } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';

export interface WebsiteContent {
  url: string;
  title?: string;
  description?: string;
  content?: string;
  markdown?: string;
  links?: string[];
  images?: string[];
  metadata?: Record<string, any>;
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
  path?: string;
  base64?: string;
  type: 'desktop' | 'mobile' | 'tablet';
  viewport?: { width: number; height: number };
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
  error?: string;
}

export interface AnalysisResult {
  type: 'technical' | 'content' | 'strategic' | 'competitive';
  findings: Record<string, any>;
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    impact?: string;
    effort?: 'low' | 'medium' | 'high';
    timeframe?: string;
  }>;
  score?: number;
  error?: string;
}

export type ReportTier = 'lite' | 'pro' | 'elite' | 'tasklist-pro';

export interface ReportError {
  node: string;
  error: string;
  timestamp: number;
  retryCount: number;
}

export const ReportStateAnnotation = Annotation.Root({
  domain: Annotation<string>,
  tier: Annotation<ReportTier>,
  reportId: Annotation<string>,
  websiteContent: Annotation<WebsiteContent | undefined>,
  seoMetrics: Annotation<SEOMetrics | undefined>,
  screenshots: Annotation<Screenshot[]>,
  competitorData: Annotation<CompetitorData[]>,
  technicalAnalysis: Annotation<AnalysisResult | undefined>,
  contentAnalysis: Annotation<AnalysisResult | undefined>,
  strategicAnalysis: Annotation<AnalysisResult | undefined>,
  competitiveAnalysis: Annotation<AnalysisResult | undefined>,
  finalReport: Annotation<Record<string, any> | undefined>,
  progress: Annotation<number>,
  progressMessage: Annotation<string>,
  errors: Annotation<ReportError[]>,
  retries: Annotation<Record<string, number>>,
  startTime: Annotation<number>,
  endTime: Annotation<number | undefined>,
  messages: Annotation<BaseMessage[]>,
  checkpointId: Annotation<string | undefined>
});

export type ReportState = typeof ReportStateAnnotation.State;

export interface NodeConfig {
  maxRetries?: number;
  timeout?: number;
  parallel?: boolean;
  tierRequired?: ReportTier[];
}

export interface GraphConfig {
  checkpointInterval?: number;
  maxConcurrentNodes?: number;
  enableTracing?: boolean;
  tracingProjectId?: string;
}

export const TIER_CONFIG: Record<ReportTier, {
  nodes: string[];
  analysisDepth: 'basic' | 'standard' | 'advanced' | 'comprehensive';
  maxExecutionTime: number;
  features: string[];
}> = {
  lite: {
    nodes: ['crawlWebsite', 'fetchSEOMetrics', 'performTechnicalAnalysis', 'compileReport'],
    analysisDepth: 'basic',
    maxExecutionTime: 180000,
    features: ['seo_audit', 'quick_wins', 'meta_analysis']
  },
  pro: {
    nodes: [
      'crawlWebsite', 
      'fetchSEOMetrics', 
      'captureScreenshots',
      'analyzeCompetitors',
      'performTechnicalAnalysis',
      'performContentAnalysis',
      'compileReport'
    ],
    analysisDepth: 'standard',
    maxExecutionTime: 360000,
    features: ['seo_audit', 'visual_analysis', 'competitor_insights', 'content_optimization']
  },
  elite: {
    nodes: [
      'crawlWebsite',
      'fetchSEOMetrics',
      'captureScreenshots',
      'analyzeCompetitors',
      'performTechnicalAnalysis',
      'performContentAnalysis',
      'performStrategicAnalysis',
      'performCompetitiveAnalysis',
      'compileReport'
    ],
    analysisDepth: 'advanced',
    maxExecutionTime: 720000,
    features: [
      'seo_audit',
      'visual_analysis',
      'competitor_insights',
      'content_optimization',
      'strategic_planning',
      'market_positioning',
      'roi_projections'
    ]
  },
  'tasklist-pro': {
    nodes: [
      'crawlWebsite',
      'fetchSEOMetrics',
      'captureScreenshots',
      'analyzeCompetitors',
      'performTechnicalAnalysis',
      'performContentAnalysis',
      'performStrategicAnalysis',
      'performCompetitiveAnalysis',
      'generateTasklist',
      'compileReport'
    ],
    analysisDepth: 'comprehensive',
    maxExecutionTime: 600000,
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
    ]
  }
};