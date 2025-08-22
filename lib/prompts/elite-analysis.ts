/**
 * Elite Report AI Analysis Prompts (€149 tier)
 * 
 * Focus: Comprehensive strategic analysis, advanced competitive intelligence, enterprise-level recommendations
 * Tools: Firecrawl + Playwright + DataForSEO (full utilization)
 * Analysis Time: ~10 minutes
 */

export const ELITE_STRATEGIC_ANALYSIS_PROMPT = `
You are conducting an elite-level website analysis for a comprehensive SEO strategy (€149 tier).
This analysis should provide strategic insights suitable for enterprise clients and serious SEO investments.

Perform comprehensive strategic analysis across these domains:

1. **Enterprise Technical SEO**
   - International SEO considerations (hreflang, geo-targeting)
   - Advanced schema markup strategy
   - Technical infrastructure optimization
   - Enterprise-scale crawlability analysis
   - Security and Core Web Vitals optimization
   - JavaScript SEO considerations

2. **Advanced Competitive Intelligence**
   - Market share analysis and opportunities
   - Competitor content strategy deep-dive
   - Backlink profile analysis and link building opportunities
   - Competitive keyword clustering and topic modeling
   - Brand mention and sentiment analysis
   - Competitor technical stack analysis

3. **Strategic Content Architecture**
   - Topic authority and expertise assessment
   - Content hub and cluster strategy
   - Semantic SEO and entity optimization
   - User intent mapping and content alignment
   - Content personalization opportunities
   - Multi-channel content strategy

4. **Advanced User Experience Strategy**
   - Conversion funnel optimization
   - Personalization and segmentation opportunities
   - Advanced accessibility compliance (WCAG 2.1 AA)
   - Progressive Web App (PWA) considerations
   - Voice search optimization
   - AI/ML integration opportunities

Return comprehensive analysis:
{
  "strategic_overview": {
    "market_position": "Detailed market analysis",
    "growth_opportunities": ["Strategic growth vectors"],
    "competitive_moats": ["Sustainable competitive advantages"],
    "risk_assessment": ["Potential SEO risks and mitigation"],
    "investment_priority": "ROI-ranked improvement priorities"
  },
  "enterprise_technical_seo": {
    "infrastructure_analysis": {
      "hosting_optimization": "CDN and hosting recommendations",
      "international_seo": "Global SEO strategy and implementation",
      "javascript_seo": "JS framework optimization",
      "security_seo": "HTTPS, security headers, and trust signals",
      "score": 0-100
    },
    "advanced_schema": {
      "current_implementation": "Existing structured data audit",
      "strategic_opportunities": ["Enterprise schema strategies"],
      "entity_optimization": "Knowledge graph optimization",
      "score": 0-100
    },
    "performance_optimization": {
      "core_web_vitals": "Detailed CWV analysis and optimization",
      "mobile_performance": "Mobile-first optimization strategy",
      "edge_computing": "Edge optimization opportunities",
      "score": 0-100
    }
  },
  "competitive_intelligence": {
    "market_analysis": {
      "market_share": "Competitive market share assessment",
      "growth_trends": "Industry growth patterns and opportunities",
      "disruption_threats": "Potential market disruptions",
      "white_space": "Uncontested market opportunities"
    },
    "competitor_deep_dive": {
      "content_strategies": "Detailed competitor content analysis",
      "technical_advantages": "Competitor technical capabilities",
      "link_building_strategies": "Competitor backlink analysis",
      "social_media_presence": "Multi-channel competitive analysis"
    },
    "keyword_intelligence": {
      "cluster_analysis": "Advanced keyword clustering",
      "intent_mapping": "User intent and keyword alignment",
      "seasonal_patterns": "Temporal keyword opportunities",
      "long_tail_opportunities": "Long-tail keyword strategies"
    }
  },
  "content_architecture": {
    "topic_authority": {
      "current_authority": "Domain expertise assessment",
      "authority_gaps": "Expertise areas to develop",
      "content_clusters": "Strategic content hub opportunities",
      "thought_leadership": "Thought leadership content strategy"
    },
    "semantic_optimization": {
      "entity_relationships": "Entity-based SEO opportunities",
      "topic_modeling": "Advanced topic analysis",
      "content_relationships": "Content interconnection strategy",
      "knowledge_graph": "Knowledge graph optimization"
    },
    "user_intent_alignment": {
      "intent_mapping": "Content to intent alignment",
      "journey_optimization": "User journey content mapping",
      "personalization": "Content personalization opportunities",
      "multi_format_strategy": "Content format diversification"
    }
  },
  "advanced_ux_strategy": {
    "conversion_optimization": {
      "funnel_analysis": "Detailed conversion funnel audit",
      "segmentation_opportunities": "User segmentation strategies",
      "personalization_strategy": "Dynamic content personalization",
      "testing_framework": "A/B testing and optimization strategy"
    },
    "accessibility_excellence": {
      "wcag_compliance": "Advanced accessibility audit",
      "inclusive_design": "Inclusive design recommendations",
      "assistive_technology": "Assistive technology optimization",
      "legal_compliance": "ADA/accessibility legal considerations"
    },
    "emerging_technologies": {
      "voice_search": "Voice search optimization strategy",
      "ai_integration": "AI/ML integration opportunities",
      "pwa_strategy": "Progressive Web App implementation",
      "ar_vr_considerations": "Immersive technology opportunities"
    }
  },
  "strategic_recommendations": [
    {
      "initiative": "Strategic initiative name",
      "category": "Technical|Content|UX|Competitive",
      "priority": "Critical|High|Medium|Low",
      "impact": "Revenue/traffic impact assessment",
      "effort": "Resource requirements and timeline",
      "dependencies": "Prerequisites and dependencies",
      "success_metrics": "KPIs and success measurement",
      "roi_projection": "Expected return on investment"
    }
  ],
  "overall_strategic_score": 0-100
}

Provide enterprise-level strategic insights with detailed implementation roadmaps and ROI projections.
`;

export const ELITE_IMPLEMENTATION_ROADMAP_PROMPT = `
Create a comprehensive implementation roadmap for elite-level SEO strategy.
This roadmap should guide enterprise implementation over 6-12 months.

Design a strategic implementation plan covering:

1. **Phase-Based Implementation**
   - Quick wins and foundation building
   - Strategic initiatives and scaling
   - Advanced optimization and innovation
   - Continuous improvement and adaptation

2. **Resource Allocation Strategy**
   - Team structure and skill requirements
   - Technology stack and tool requirements
   - Budget allocation and ROI tracking
   - Vendor and agency coordination

3. **Risk Management and Contingency**
   - Algorithm update preparation
   - Competitive response strategies
   - Technical risk mitigation
   - Performance monitoring and alerts

4. **Success Measurement Framework**
   - KPI definition and tracking
   - Reporting structure and frequency
   - Attribution modeling
   - Continuous optimization protocols

Structure the roadmap as:
{
  "implementation_phases": {
    "phase_1_foundation": {
      "duration": "Months 1-2",
      "title": "Foundation and Quick Wins",
      "objectives": ["Primary goals for this phase"],
      "deliverables": [
        {
          "item": "Deliverable name",
          "description": "Detailed description",
          "owner": "Responsible team/person",
          "timeline": "Specific timeline",
          "success_criteria": "Completion criteria",
          "dependencies": "Prerequisites"
        }
      ],
      "resource_requirements": {
        "team": "Team composition needed",
        "budget": "Budget allocation",
        "tools": "Required tools and technology",
        "external_vendors": "Third-party requirements"
      },
      "expected_outcomes": {
        "metrics": "Expected metric improvements",
        "business_impact": "Business value delivered",
        "foundation_built": "Infrastructure/capability built"
      }
    },
    "phase_2_strategic": {
      "duration": "Months 3-6",
      "title": "Strategic Implementation",
      "objectives": ["Strategic goals"],
      "deliverables": ["Strategic deliverables with details"],
      "resource_requirements": "Resource needs",
      "expected_outcomes": "Strategic outcomes"
    },
    "phase_3_optimization": {
      "duration": "Months 7-12",
      "title": "Advanced Optimization",
      "objectives": ["Optimization goals"],
      "deliverables": ["Optimization deliverables"],
      "resource_requirements": "Resource allocation",
      "expected_outcomes": "Optimization results"
    }
  },
  "resource_strategy": {
    "team_structure": {
      "core_team": "Internal team requirements",
      "specialized_roles": "Specialist skill requirements",
      "external_partners": "Agency/vendor recommendations",
      "skill_development": "Training and development needs"
    },
    "technology_stack": {
      "essential_tools": "Must-have SEO tools",
      "monitoring_platforms": "Analytics and monitoring setup",
      "automation_tools": "Process automation opportunities",
      "integration_requirements": "System integration needs"
    },
    "budget_allocation": {
      "tool_investments": "Software and tool costs",
      "content_creation": "Content development budget",
      "technical_development": "Development and IT costs",
      "contingency": "Risk mitigation budget"
    }
  },
  "risk_management": {
    "algorithm_updates": {
      "monitoring_strategy": "Algorithm change detection",
      "response_protocols": "Update response procedures",
      "recovery_plans": "Traffic recovery strategies",
      "prevention_measures": "Proactive protection strategies"
    },
    "competitive_threats": {
      "monitoring_framework": "Competitive intelligence system",
      "response_strategies": "Competitive response plans",
      "differentiation_tactics": "Competitive advantage maintenance",
      "market_disruption": "Disruption response planning"
    },
    "technical_risks": {
      "infrastructure_risks": "Technical infrastructure protection",
      "security_considerations": "SEO security best practices",
      "migration_planning": "Site migration and change management",
      "backup_strategies": "Recovery and backup procedures"
    }
  },
  "success_measurement": {
    "kpi_framework": {
      "primary_kpis": "Core business metrics",
      "seo_metrics": "SEO-specific measurements",
      "leading_indicators": "Predictive metrics",
      "lagging_indicators": "Results metrics"
    },
    "reporting_structure": {
      "executive_reporting": "C-level reporting format",
      "operational_reporting": "Team-level reporting",
      "stakeholder_communication": "Stakeholder update protocols",
      "performance_reviews": "Regular review processes"
    },
    "optimization_cycles": {
      "testing_framework": "Continuous testing approach",
      "iteration_cycles": "Improvement iteration schedule",
      "learning_integration": "Knowledge capture and application",
      "strategy_evolution": "Strategic adaptation protocols"
    }
  },
  "roi_projections": {
    "year_1_projections": {
      "traffic_growth": "Expected organic traffic increase",
      "conversion_improvements": "Conversion rate optimization results",
      "revenue_impact": "Direct revenue attribution",
      "cost_savings": "Efficiency gains and cost reductions"
    },
    "long_term_value": {
      "brand_authority": "Brand and authority building value",
      "market_position": "Competitive position improvements",
      "asset_value": "Digital asset value creation",
      "scalability": "Growth scalability achievements"
    }
  }
}

Provide detailed, actionable implementation guidance suitable for enterprise-level execution.
`;

export const ELITE_FINAL_REPORT_PROMPT = `
Create a comprehensive Elite tier website analysis report (€149) that provides 
strategic insights and enterprise-level recommendations for significant SEO investment.

This report should serve as a strategic blueprint for 6-12 months of SEO initiatives.

Structure the comprehensive report as:
{
  "executive_summary": {
    "strategic_overview": "High-level strategic assessment",
    "market_opportunity": "Market size and growth opportunity",
    "competitive_position": "Current vs. optimal market position",
    "investment_thesis": "Why SEO investment will drive business results",
    "recommended_investment": "Suggested budget and resource allocation",
    "expected_roi": "12-month ROI projection with confidence intervals"
  },
  "comprehensive_analysis": {
    "market_landscape": {
      "industry_analysis": "Industry trends and opportunities",
      "competitive_benchmarking": "Detailed competitive analysis",
      "market_share_potential": "Addressable market and share potential",
      "disruption_analysis": "Potential market disruptions and opportunities"
    },
    "current_performance": {
      "strengths_assessment": "Core competitive advantages",
      "opportunity_analysis": "Identified improvement opportunities",
      "risk_evaluation": "Current SEO risks and vulnerabilities",
      "performance_benchmarking": "Performance vs. industry standards"
    },
    "strategic_priorities": {
      "revenue_drivers": "Initiatives with highest revenue impact",
      "competitive_advantages": "Sustainable competitive advantage opportunities",
      "efficiency_gains": "Process and efficiency improvements",
      "innovation_opportunities": "Emerging technology and strategy opportunities"
    }
  },
  "strategic_roadmap": {
    "12_month_strategy": {
      "strategic_pillars": "Core strategic focus areas",
      "milestone_timeline": "Key milestones and deliverables",
      "resource_allocation": "Team and budget allocation strategy",
      "success_metrics": "Strategic KPIs and measurement framework"
    },
    "implementation_phases": "Detailed phase-by-phase implementation plan",
    "resource_requirements": {
      "internal_capabilities": "Required internal team capabilities",
      "external_partnerships": "Recommended agency/vendor relationships",
      "technology_investments": "Platform and tool requirements",
      "budget_planning": "Detailed budget allocation recommendations"
    }
  },
  "competitive_strategy": {
    "differentiation_strategy": "How to differentiate from competitors",
    "market_positioning": "Optimal market positioning strategy",
    "competitive_responses": "Anticipated competitor reactions and counter-strategies",
    "blue_ocean_opportunities": "Uncontested market space identification"
  },
  "innovation_opportunities": {
    "emerging_technologies": "AI, voice search, and emerging tech integration",
    "content_innovation": "Next-generation content strategies",
    "user_experience_evolution": "Advanced UX and personalization",
    "channel_integration": "Omnichannel SEO and marketing integration"
  },
  "risk_mitigation": {
    "algorithm_protection": "Algorithm update protection strategies",
    "competitive_threats": "Competitive threat mitigation",
    "technical_risks": "Technical infrastructure protection",
    "market_risks": "Market change adaptation strategies"
  },
  "financial_projections": {
    "investment_summary": {
      "total_investment": "12-month investment requirements",
      "investment_breakdown": "Detailed cost allocation",
      "funding_timeline": "Investment timing and cash flow",
      "roi_timeline": "Expected return timeline and milestones"
    },
    "revenue_projections": {
      "traffic_growth": "Organic traffic growth projections",
      "conversion_optimization": "Conversion rate improvement projections",
      "customer_value": "Customer lifetime value impact",
      "market_share": "Market share growth potential"
    },
    "risk_adjusted_returns": {
      "conservative_scenario": "Conservative outcome projections",
      "optimistic_scenario": "Best-case outcome projections",
      "risk_factors": "Key risk factors and mitigation costs",
      "break_even_analysis": "Investment break-even timeline"
    }
  },
  "implementation_support": {
    "change_management": "Organizational change management strategy",
    "training_requirements": "Team skill development and training",
    "vendor_selection": "Recommended vendor evaluation criteria",
    "governance_framework": "Project governance and oversight structure"
  },
  "performance_monitoring": {
    "measurement_framework": "Comprehensive KPI and analytics framework",
    "reporting_protocols": "Executive and operational reporting structure",
    "optimization_cycles": "Continuous improvement and optimization protocols",
    "strategic_reviews": "Quarterly strategic review and adaptation process"
  }
}

Provide strategic, enterprise-level insights with detailed financial projections and implementation guidance.
Include specific recommendations for organizational capability building and competitive positioning.
`;

export function getEliteAnalysisPrompts() {
  return {
    strategicAnalysis: ELITE_STRATEGIC_ANALYSIS_PROMPT,
    implementationRoadmap: ELITE_IMPLEMENTATION_ROADMAP_PROMPT,
    finalReport: ELITE_FINAL_REPORT_PROMPT,
  };
}