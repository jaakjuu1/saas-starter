/**
 * Tasklist Pro Report AI Analysis Prompts (€299 tier)
 * 
 * Focus: Executive-level analysis with actionable tasks, implementation timelines, ROI estimates
 * Tools: Firecrawl + Playwright + DataForSEO + Task management integration
 * Analysis Time: ~8 minutes
 * Output: Structured tasks ready for export to Asana/Notion/CSV
 */

export const TASKLIST_EXECUTIVE_ANALYSIS_PROMPT = `
You are creating an executive-level website analysis for the Tasklist Pro tier (€299).
This analysis must convert all insights into specific, actionable tasks with clear priorities, timelines, and ROI estimates.

Focus on creating an executive dashboard view with implementable action items:

1. **Executive Strategic Overview**
   - Business impact assessment with quantified opportunities
   - Strategic priority ranking with ROI justification
   - Resource requirement analysis
   - Timeline and milestone planning
   - Risk assessment with mitigation strategies

2. **Actionable Task Generation**
   - Break down all recommendations into specific, implementable tasks
   - Assign priority levels (Critical/High/Medium/Low)
   - Estimate effort levels (Hours/Days/Weeks)
   - Calculate expected ROI for each task
   - Define success criteria and measurement methods

3. **Implementation Planning**
   - Task dependencies and sequencing
   - Resource allocation recommendations
   - Skill requirements for each task
   - External vendor/agency requirements
   - Quality assurance and testing protocols

4. **Performance Tracking Framework**
   - KPI definition for each task
   - Measurement protocols and tools
   - Reporting schedules and stakeholders
   - Success benchmarks and targets

Return structured executive analysis:
{
  "executive_dashboard": {
    "strategic_summary": {
      "current_performance": "Quantified current state assessment",
      "growth_potential": "Quantified improvement opportunities",
      "competitive_gap": "Specific competitive disadvantages to address",
      "investment_recommendation": "Recommended investment level and allocation",
      "expected_roi": "12-month ROI projection with confidence intervals"
    },
    "priority_matrix": [
      {
        "initiative": "High-level initiative name",
        "business_impact": "High|Medium|Low",
        "implementation_effort": "Low|Medium|High",
        "priority_score": 1-100,
        "estimated_roi": "Expected return percentage",
        "timeline": "Implementation timeframe",
        "resource_requirements": "Team and budget needs"
      }
    ],
    "quick_wins": [
      {
        "opportunity": "Quick win description",
        "impact": "Expected business impact",
        "effort": "Implementation effort required",
        "timeline": "Days/weeks to implement",
        "responsible_party": "Who should execute this"
      }
    ]
  },
  "actionable_tasks": {
    "critical_tasks": [
      {
        "task_id": "Unique task identifier",
        "title": "Specific task title",
        "description": "Detailed task description",
        "category": "Technical|Content|UX|Marketing|Analytics",
        "priority": "Critical",
        "effort_estimate": "Hours/days/weeks required",
        "skill_requirements": ["Required skills/expertise"],
        "success_criteria": "Specific completion criteria",
        "kpis": ["Metrics to track"],
        "expected_impact": "Quantified expected outcome",
        "roi_estimate": "Expected ROI percentage",
        "dependencies": ["Prerequisites or dependent tasks"],
        "assigned_to": "Recommended role/team",
        "due_date": "Recommended completion date",
        "resources_needed": ["Tools, budget, or external help needed"],
        "testing_requirements": "How to validate completion",
        "notes": "Additional implementation guidance"
      }
    ],
    "high_priority_tasks": ["Same structure as critical_tasks"],
    "medium_priority_tasks": ["Same structure as critical_tasks"],
    "low_priority_tasks": ["Same structure as critical_tasks"]
  },
  "implementation_roadmap": {
    "phase_1_immediate": {
      "duration": "Weeks 1-4",
      "focus": "Critical issues and quick wins",
      "tasks": ["Task IDs for this phase"],
      "expected_outcomes": "Phase completion results",
      "success_metrics": "How to measure phase success",
      "resource_allocation": "Team and budget for this phase"
    },
    "phase_2_strategic": {
      "duration": "Months 2-6",
      "focus": "Strategic initiatives",
      "tasks": ["Task IDs for this phase"],
      "expected_outcomes": "Strategic phase results",
      "success_metrics": "Strategic success measurement",
      "resource_allocation": "Strategic phase resource needs"
    },
    "phase_3_optimization": {
      "duration": "Months 7-12",
      "focus": "Advanced optimization and scaling",
      "tasks": ["Task IDs for this phase"],
      "expected_outcomes": "Optimization phase results",
      "success_metrics": "Optimization success metrics",
      "resource_allocation": "Optimization resource requirements"
    }
  },
  "resource_planning": {
    "team_requirements": {
      "internal_roles": ["Required internal team members"],
      "skill_gaps": ["Skills to hire or train"],
      "external_partners": ["Recommended agencies or vendors"],
      "training_needs": ["Team development requirements"]
    },
    "budget_allocation": {
      "tool_investments": "Software and tool costs",
      "content_development": "Content creation budget",
      "technical_development": "Development costs",
      "marketing_spend": "Paid promotion budget",
      "contingency": "Risk mitigation budget",
      "total_investment": "Total 12-month investment"
    },
    "vendor_recommendations": [
      {
        "service_type": "Type of service needed",
        "recommended_vendors": ["Specific vendor recommendations"],
        "selection_criteria": "How to evaluate vendors",
        "budget_range": "Expected cost range",
        "contract_terms": "Recommended contract structure"
      }
    ]
  },
  "performance_monitoring": {
    "kpi_framework": {
      "business_kpis": ["Revenue and business metrics"],
      "seo_kpis": ["SEO performance metrics"],
      "operational_kpis": ["Process and efficiency metrics"],
      "leading_indicators": ["Predictive metrics"]
    },
    "reporting_structure": {
      "executive_reports": "C-level reporting format and frequency",
      "operational_reports": "Team-level reporting",
      "stakeholder_updates": "Other stakeholder communication",
      "board_presentations": "Board-level reporting requirements"
    },
    "review_cycles": {
      "daily_monitoring": "Daily check items",
      "weekly_reviews": "Weekly team reviews",
      "monthly_assessments": "Monthly strategic reviews",
      "quarterly_planning": "Quarterly strategy updates"
    }
  }
}

Create tasks that are specific enough to assign to team members with clear deliverables and success criteria.
Ensure all tasks include ROI estimates and business impact justification.
`;

export const TASKLIST_TASK_EXPORT_PROMPT = `
Convert the comprehensive analysis into exportable task formats for project management tools.
Create structured task data ready for import into Asana, Notion, or CSV export.

Generate tasks in multiple formats:

1. **CSV Export Format**
   - Flat structure suitable for spreadsheet import
   - All task details in spreadsheet columns
   - Standardized priority and effort coding

2. **Asana Import Format**
   - Project structure with sections
   - Task dependencies and subtasks
   - Due dates and assignee fields
   - Custom field values for priority and ROI

3. **Notion Database Format**
   - Database properties for all task attributes
   - Relationship connections for dependencies
   - Formula fields for ROI calculations
   - Template structure for task pages

Return export-ready data:
{
  "csv_export": {
    "headers": ["Column headers for CSV"],
    "rows": [
      ["Task data row 1"],
      ["Task data row 2"]
    ],
    "instructions": "How to import the CSV data"
  },
  "asana_export": {
    "project_structure": {
      "project_name": "SEO Implementation Project",
      "sections": [
        {
          "section_name": "Critical Tasks",
          "tasks": [
            {
              "name": "Task title",
              "notes": "Task description and details",
              "assignee": "Team member or role",
              "due_date": "YYYY-MM-DD",
              "priority": "High|Medium|Low",
              "custom_fields": {
                "ROI_Estimate": "Percentage",
                "Effort_Level": "Hours/Days/Weeks",
                "Category": "Technical|Content|UX|Marketing"
              },
              "subtasks": ["Subtask items"],
              "dependencies": ["Dependent task names"]
            }
          ]
        }
      ]
    },
    "import_instructions": "Step-by-step Asana import guide"
  },
  "notion_export": {
    "database_schema": {
      "properties": {
        "Title": "Title property configuration",
        "Status": "Select property with status options",
        "Priority": "Select property with priority levels",
        "Effort": "Select property with effort estimates",
        "ROI": "Number property for ROI percentage",
        "Category": "Select property with categories",
        "Assignee": "Person property",
        "Due_Date": "Date property",
        "Dependencies": "Relation property to other tasks"
      }
    },
    "database_entries": [
      {
        "Title": "Task title",
        "Status": "Not Started",
        "Priority": "High",
        "Effort": "2 weeks",
        "ROI": 25,
        "Category": "Technical",
        "Assignee": "Team member",
        "Due_Date": "2025-09-15",
        "Description": "Detailed task description",
        "Success_Criteria": "Completion criteria",
        "Resources": "Required resources"
      }
    ],
    "template_structure": "Notion page template for tasks",
    "import_instructions": "Notion database setup guide"
  },
  "project_management_recommendations": {
    "tool_selection": "Recommended PM tool based on team size",
    "workflow_setup": "Recommended workflow and process",
    "tracking_methods": "How to track progress and ROI",
    "reporting_automation": "Automated reporting setup"
  }
}

Ensure all export formats maintain task relationships and dependencies.
Provide clear import instructions for each platform.
`;

export const TASKLIST_ROI_CALCULATOR_PROMPT = `
Create detailed ROI calculations and business case justification for each task and initiative.
Provide financial modeling suitable for executive decision-making.

Calculate ROI using multiple methodologies:

1. **Traffic-Based ROI**
   - Organic traffic increase projections
   - Conversion rate improvement estimates
   - Average order value impact
   - Customer lifetime value considerations

2. **Efficiency-Based ROI**
   - Time savings from automation
   - Process improvement benefits
   - Cost reduction opportunities
   - Resource optimization gains

3. **Competitive-Based ROI**
   - Market share capture opportunities
   - Competitive advantage value
   - Brand authority building value
   - Long-term positioning benefits

4. **Risk-Adjusted ROI**
   - Probability-weighted outcomes
   - Scenario planning (conservative/optimistic)
   - Risk mitigation value
   - Contingency planning costs

Structure ROI analysis as:
{
  "roi_summary": {
    "total_investment": "12-month total investment",
    "expected_return": "Projected 12-month returns",
    "net_roi": "Net ROI percentage",
    "payback_period": "Months to break even",
    "confidence_level": "High|Medium|Low confidence in projections"
  },
  "task_level_roi": [
    {
      "task_id": "Task identifier",
      "task_title": "Task name",
      "investment_required": "Cost to complete task",
      "expected_return": "Projected return from task",
      "roi_percentage": "Task-specific ROI",
      "payback_timeline": "Time to see returns",
      "confidence_level": "Confidence in ROI projection",
      "calculation_method": "How ROI was calculated",
      "assumptions": ["Key assumptions in calculation"],
      "risk_factors": ["Factors that could affect ROI"]
    }
  ],
  "financial_modeling": {
    "revenue_projections": {
      "baseline_scenario": "Conservative revenue projection",
      "expected_scenario": "Most likely revenue outcome",
      "optimistic_scenario": "Best-case revenue projection",
      "methodology": "How projections were calculated"
    },
    "cost_analysis": {
      "implementation_costs": "Direct implementation costs",
      "opportunity_costs": "Resources diverted from other activities",
      "ongoing_costs": "Recurring costs and maintenance",
      "risk_mitigation_costs": "Contingency and risk management"
    },
    "sensitivity_analysis": {
      "traffic_sensitivity": "ROI impact of traffic variations",
      "conversion_sensitivity": "ROI impact of conversion variations",
      "timeline_sensitivity": "ROI impact of timeline changes",
      "competition_sensitivity": "ROI impact of competitive responses"
    }
  },
  "business_case": {
    "strategic_value": "Non-financial strategic benefits",
    "competitive_necessity": "Why this investment is competitively required",
    "risk_of_inaction": "Cost of not implementing these changes",
    "long_term_value": "Value beyond 12-month projection period",
    "executive_summary": "One-page business case summary"
  },
  "implementation_economics": {
    "resource_optimization": "How to maximize ROI through efficient execution",
    "phased_investment": "How to stage investment for optimal cash flow",
    "early_wins": "Quick ROI opportunities to fund later phases",
    "scaling_opportunities": "How success can be scaled for additional returns"
  }
}

Provide conservative, realistic ROI projections with clear methodology and assumptions.
Include scenario planning for different outcome possibilities.
`;

export function getTasklistAnalysisPrompts() {
  return {
    executiveAnalysis: TASKLIST_EXECUTIVE_ANALYSIS_PROMPT,
    taskExport: TASKLIST_TASK_EXPORT_PROMPT,
    roiCalculator: TASKLIST_ROI_CALCULATOR_PROMPT,
  };
}