/**
 * Pro Report AI Analysis Prompts (€69 tier)
 * 
 * Focus: Advanced technical analysis, competitor insights, visual UX analysis
 * Tools: Firecrawl + Playwright + DataForSEO
 * Analysis Time: ~5 minutes
 */

export const PRO_COMPREHENSIVE_ANALYSIS_PROMPT = `
You are conducting an advanced website analysis for a professional SEO audit (€69 tier).
This analysis should provide detailed technical insights and competitive intelligence.

Perform comprehensive analysis across these areas:

1. **Advanced Technical SEO**
   - Page speed optimization opportunities
   - Core Web Vitals analysis and recommendations
   - Schema markup implementation assessment
   - Technical SEO audit (crawlability, indexability)
   - Mobile-first indexing compliance

2. **Competitive Analysis**
   - Competitor keyword gap analysis
   - Backlink profile comparison (basic)
   - Content strategy comparison
   - Market positioning assessment
   - Competitive advantage identification

3. **Visual UX Analysis** (from screenshots)
   - Conversion optimization opportunities
   - User interface design assessment
   - Call-to-action effectiveness
   - Visual hierarchy evaluation
   - Mobile design quality

4. **Advanced Content Strategy**
   - Content gap analysis vs competitors
   - Keyword cannibalization detection
   - Content cluster opportunities
   - Topic authority assessment

Return detailed analysis in this structure:
{
  "technical_seo": {
    "page_speed": {
      "analysis": "Detailed speed analysis",
      "core_web_vitals": "LCP, FID, CLS assessment",
      "optimization_opportunities": ["Specific improvements"],
      "score": 0-100
    },
    "crawlability": {
      "robots_txt": "Robots.txt analysis",
      "sitemap": "XML sitemap assessment",
      "internal_linking": "Link structure analysis",
      "score": 0-100
    },
    "schema_markup": {
      "current_implementation": "Existing structured data",
      "opportunities": ["Schema types to implement"],
      "score": 0-100
    }
  },
  "competitive_analysis": {
    "keyword_gaps": ["Keywords competitors rank for that you don't"],
    "content_gaps": ["Content types/topics missing"],
    "competitive_advantages": ["Your strengths vs competitors"],
    "market_positioning": "Position in competitive landscape",
    "score": 0-100
  },
  "ux_analysis": {
    "visual_hierarchy": "Design hierarchy assessment",
    "conversion_elements": "CTA and conversion optimization",
    "mobile_experience": "Mobile UX quality",
    "accessibility": "Advanced accessibility audit",
    "score": 0-100
  },
  "content_strategy": {
    "topic_clusters": ["Content cluster opportunities"],
    "keyword_cannibalization": "Instances of keyword conflicts",
    "content_depth": "Content quality vs competitors",
    "freshness_strategy": "Content update recommendations",
    "score": 0-100
  },
  "overall_score": 0-100
}

Provide actionable, data-driven recommendations suitable for businesses ready to invest in serious SEO.
`;

export const PRO_COMPETITOR_ANALYSIS_PROMPT = `
Conduct a detailed competitive analysis for the Pro tier report.
Identify actionable opportunities based on competitor research.

Analyze these competitive factors:

1. **Keyword Competition**
   - Competitor keyword portfolios
   - Keyword difficulty assessment
   - Gap opportunities
   - Low-hanging fruit identification

2. **Content Strategy Comparison**
   - Content types and formats
   - Topic coverage analysis
   - Content depth comparison
   - Update frequency patterns

3. **Technical Competitive Advantages**
   - Site speed comparisons
   - Mobile experience quality
   - Schema markup implementation
   - Technical SEO advantages/disadvantages

4. **Market Positioning**
   - Brand positioning analysis
   - Value proposition differentiation
   - Target audience overlap
   - Competitive moats identification

Structure the analysis as:
{
  "competitor_overview": {
    "main_competitors": ["List of primary competitors"],
    "market_landscape": "Industry competition assessment",
    "positioning_analysis": "How the site positions vs competitors"
  },
  "keyword_opportunities": [
    {
      "keyword": "Target keyword",
      "difficulty": "Low|Medium|High",
      "opportunity": "Why this keyword is valuable",
      "competitor_analysis": "How competitors rank for this",
      "strategy": "Recommended approach"
    }
  ],
  "content_gaps": [
    {
      "topic": "Content topic/type",
      "competitor_coverage": "How competitors address this",
      "opportunity_size": "Potential traffic/value",
      "content_suggestion": "Specific content recommendation"
    }
  ],
  "technical_advantages": {
    "your_strengths": ["Technical areas where you lead"],
    "competitor_strengths": ["Areas where competitors excel"],
    "improvement_opportunities": ["Technical gaps to address"]
  },
  "strategic_recommendations": [
    {
      "strategy": "Strategic approach",
      "rationale": "Why this strategy makes sense",
      "implementation": "How to execute",
      "timeline": "Expected timeframe",
      "expected_impact": "Projected results"
    }
  ]
}

Focus on actionable insights that can drive measurable business results.
`;

export const PRO_UX_OPTIMIZATION_PROMPT = `
Perform detailed UX and conversion optimization analysis for the Pro tier.
Focus on actionable improvements that can increase conversions and user engagement.

Analyze these UX factors:

1. **Conversion Optimization**
   - Call-to-action placement and design
   - Form optimization opportunities
   - Trust signals and social proof
   - Checkout/conversion funnel analysis

2. **Visual Design Assessment**
   - Visual hierarchy effectiveness
   - Color psychology and branding
   - Typography and readability
   - White space and layout optimization

3. **User Experience Flow**
   - Navigation intuitiveness
   - Information architecture
   - User journey optimization
   - Friction point identification

4. **Mobile Experience**
   - Mobile-first design quality
   - Touch target optimization
   - Mobile conversion barriers
   - App-like experience features

Return UX analysis as:
{
  "conversion_optimization": {
    "cta_analysis": {
      "current_ctas": "Assessment of existing CTAs",
      "optimization_opportunities": ["Specific CTA improvements"],
      "placement_recommendations": ["Better CTA positioning"],
      "design_suggestions": ["Visual design improvements"]
    },
    "form_optimization": {
      "current_forms": "Form analysis",
      "friction_points": ["Form usability issues"],
      "optimization_suggestions": ["Form improvement recommendations"]
    },
    "trust_signals": {
      "existing_signals": "Current trust elements",
      "missing_elements": ["Trust signals to add"],
      "placement_strategy": "Where to position trust elements"
    },
    "score": 0-100
  },
  "visual_design": {
    "hierarchy": "Visual hierarchy assessment",
    "branding": "Brand consistency evaluation",
    "readability": "Typography and readability analysis",
    "color_strategy": "Color psychology effectiveness",
    "score": 0-100
  },
  "user_flow": {
    "navigation": "Navigation clarity and intuitiveness",
    "information_architecture": "Content organization assessment",
    "user_journey": "Path to conversion analysis",
    "friction_points": ["Identified UX barriers"],
    "score": 0-100
  },
  "mobile_experience": {
    "mobile_design": "Mobile-first design quality",
    "touch_optimization": "Touch target and interaction design",
    "mobile_speed": "Mobile performance assessment",
    "mobile_conversions": "Mobile conversion optimization",
    "score": 0-100
  },
  "recommendations": [
    {
      "category": "UX category",
      "improvement": "Specific improvement",
      "impact": "Expected conversion impact",
      "implementation": "How to implement",
      "priority": "High|Medium|Low",
      "effort": "Low|Medium|High"
    }
  ],
  "overall_ux_score": 0-100
}

Prioritize improvements by conversion impact and implementation feasibility.
`;

export const PRO_FINAL_REPORT_PROMPT = `
Create a comprehensive Pro tier website analysis report (€69) that provides 
advanced insights and strategic recommendations for serious SEO investment.

Combine all analysis data into a professional, actionable report.

Structure the report as:
{
  "executive_summary": {
    "current_performance": "Detailed performance overview",
    "key_opportunities": ["Top 3-4 strategic opportunities"],
    "competitive_position": "Market position assessment",
    "revenue_impact": "Potential business impact description"
  },
  "detailed_analysis": {
    "technical_seo": {
      "strengths": ["Technical advantages"],
      "weaknesses": ["Technical gaps"],
      "recommendations": ["Specific technical improvements"],
      "score": 0-100
    },
    "competitive_landscape": {
      "market_position": "Current competitive standing",
      "keyword_opportunities": ["High-value keyword targets"],
      "content_gaps": ["Strategic content opportunities"],
      "differentiation_strategy": "How to stand out from competitors"
    },
    "ux_optimization": {
      "conversion_opportunities": ["CRO improvements"],
      "user_experience": "UX quality assessment",
      "mobile_optimization": "Mobile experience quality",
      "accessibility": "Accessibility compliance and opportunities"
    }
  },
  "strategic_roadmap": {
    "phase_1": {
      "title": "Immediate Wins (Weeks 1-4)",
      "actions": ["Quick impact improvements"],
      "expected_results": "Phase 1 outcomes",
      "effort_required": "Resource requirements"
    },
    "phase_2": {
      "title": "Strategic Improvements (Months 2-3)",
      "actions": ["Medium-term strategic initiatives"],
      "expected_results": "Phase 2 outcomes",
      "effort_required": "Resource requirements"
    },
    "phase_3": {
      "title": "Advanced Optimization (Months 4-6)",
      "actions": ["Advanced optimization initiatives"],
      "expected_results": "Phase 3 outcomes",
      "effort_required": "Resource requirements"
    }
  },
  "competitive_strategy": {
    "keyword_targeting": ["Strategic keyword targets"],
    "content_strategy": ["Content initiatives to outrank competitors"],
    "technical_advantages": ["Technical improvements for competitive edge"],
    "market_positioning": "Strategic positioning recommendations"
  },
  "roi_projections": {
    "traffic_increase": "Expected organic traffic growth",
    "conversion_improvements": "Expected conversion rate improvements",
    "revenue_impact": "Projected revenue increase",
    "investment_requirements": "Resources needed for implementation"
  },
  "performance_metrics": {
    "current_scores": "Baseline performance metrics",
    "target_scores": "Goal performance metrics",
    "kpis_to_track": ["Key metrics to monitor"],
    "reporting_frequency": "Recommended tracking schedule"
  }
}

Provide strategic, data-driven recommendations suitable for businesses ready to make significant SEO investments.
Include specific implementation guidance and realistic timelines.
`;

export function getProAnalysisPrompts() {
  return {
    comprehensiveAnalysis: PRO_COMPREHENSIVE_ANALYSIS_PROMPT,
    competitorAnalysis: PRO_COMPETITOR_ANALYSIS_PROMPT,
    uxOptimization: PRO_UX_OPTIMIZATION_PROMPT,
    finalReport: PRO_FINAL_REPORT_PROMPT,
  };
}