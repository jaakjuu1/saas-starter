# Task List: Blog Post Generation System

## Overview
This task list implements a comprehensive blog post generation system that leverages existing AI infrastructure to create SEO-optimized content targeting business owners with website pain points. The system will generate markdown-based blog posts that serve as lead generation tools, driving traffic to the core site auditing service. This implementation follows the PRD requirements and technical blueprint architecture, integrating seamlessly with existing LangGraph, MCP, and BullMQ infrastructure.

## Relevant Files
- `app/api/blog-posts/route.ts` – new API controller for blog post management
- `app/api/blog-posts/[id]/route.ts` – individual blog post API endpoints
- `app/api/blog-posts/generate/route.ts` – blog post generation trigger
- `app/admin/blog-posts/page.tsx` – admin blog post management interface
- `app/admin/blog-posts/[id]/page.tsx` – individual blog post editor
- `components/admin/blog-post-generator.tsx` – blog post generation component
- `components/admin/blog-post-editor.tsx` – markdown editor component
- `components/admin/blog-post-manager.tsx` – blog post management dashboard
- `components/admin/pain-point-selector.tsx` – pain point selection interface
- `components/admin/seo-optimizer.tsx` – SEO metadata management
- `lib/blog-posts/service.ts` – blog post business logic service
- `lib/blog-posts/worker.ts` – background worker for content generation
- `lib/blog-posts/queue.ts` – BullMQ queue configuration
- `lib/blog-posts/prompts.ts` – extended prompt system for blog posts
- `lib/blog-posts/graph.ts` – extended LangGraph workflow
- `lib/db/schema.ts` – extended database schema
- `lib/db/migrations/` – database migration files
- `tests/unit/blog-posts/` – unit tests for blog post functionality
- `tests/integration/blog-posts/` – integration tests

## Tasks

### 1.0 Database Schema & Migration Setup
- [ ] 1.1 Extend `lib/db/schema.ts` with blog_posts table definition
- [ ] 1.2 Add blog_post_metadata table to schema
- [ ] 1.3 Create pain_point_categories table in schema
- [ ] 1.4 Generate database migration file for new tables
- [ ] 1.5 Update seed data to include initial pain point categories
- [ ] 1.6 Test migration rollback and forward compatibility

### 2.0 Core Service Layer Implementation
- [ ] 2.1 Create `lib/blog-posts/service.ts` with CRUD operations
- [ ] 2.2 Implement markdown file generation and storage logic
- [ ] 2.3 Add pain point targeting and categorization logic
- [ ] 2.4 Create SEO metadata management functions
- [ ] 2.5 Implement blog post publishing/unpublishing logic
- [ ] 2.6 Add validation and error handling to service layer

### 3.0 Background Job Processing Setup
- [ ] 3.1 Create `lib/blog-posts/queue.ts` with BullMQ configuration
- [ ] 3.2 Implement `lib/blog-posts/worker.ts` for content generation
- [ ] 3.3 Add job retry logic and error handling to worker
- [ ] 3.4 Integrate worker with existing queue monitoring
- [ ] 3.5 Test background job processing with sample data

### 4.0 AI Integration & Content Generation
- [ ] 4.1 Extend `lib/prompts/` with blog post generation prompts
- [ ] 4.2 Create `lib/blog-posts/graph.ts` extending LangGraph workflow
- [ ] 4.3 Integrate with existing MCP client for AI services
- [ ] 4.4 Implement pain point-based content targeting logic
- [ ] 4.5 Add SEO optimization recommendations to AI prompts
- [ ] 4.6 Test AI content generation with various pain points

### 5.0 API Endpoints Development
- [ ] 5.1 Create `app/api/blog-posts/route.ts` for CRUD operations
- [ ] 5.2 Implement `app/api/blog-posts/generate/route.ts` for generation
- [ ] 5.3 Add `app/api/blog-posts/[id]/route.ts` for individual posts
- [ ] 5.4 Integrate authentication middleware for admin-only access
- [ ] 5.5 Add input validation and error response handling
- [ ] 5.6 Implement proper HTTP status codes and response formats

### 6.0 Admin Interface Components
- [ ] 6.1 Create `components/admin/blog-post-generator.tsx` component
- [ ] 6.2 Build `components/admin/blog-post-editor.tsx` with markdown support
- [ ] 6.3 Implement `components/admin/blog-post-manager.tsx` dashboard
- [ ] 6.4 Add `components/admin/pain-point-selector.tsx` interface
- [ ] 6.5 Create `components/admin/seo-optimizer.tsx` component
- [ ] 6.6 Ensure all components follow existing TypeScript patterns

### 7.0 Admin Page Implementation
- [ ] 7.1 Create `app/admin/blog-posts/page.tsx` for main admin interface
- [ ] 7.2 Implement `app/admin/blog-posts/[id]/page.tsx` for editing
- [ ] 7.3 Add navigation and routing for admin blog section
- [ ] 7.4 Integrate with existing authentication for admin access
- [ ] 7.5 Ensure admin interface is separate from user dashboard
- [ ] 7.6 Add proper loading states and error handling

### 8.0 Lead Generation Integration
- [ ] 8.1 Add CTA components for site auditing service
- [ ] 8.2 Integrate CTAs with existing pricing and checkout flow
- [ ] 8.3 Implement lead tracking for blog post conversions
- [ ] 8.4 Add analytics tracking for blog post performance
- [ ] 8.5 Test CTA integration and conversion flow

### 9.0 Testing Implementation
- [ ] 9.1 Write unit tests for `lib/blog-posts/service.ts`
- [ ] 9.2 Create tests for API endpoints in `tests/unit/blog-posts/`
- [ ] 9.3 Add integration tests for complete workflow
- [ ] 9.4 Test background job processing and error scenarios
- [ ] 9.5 Validate markdown file generation and storage
- [ ] 9.6 Test authentication and authorization for admin access

### 10.0 Deployment & Monitoring
- [ ] 10.1 Add environment variables for blog post storage paths
- [ ] 10.2 Configure file storage for markdown files
- [ ] 10.3 Update deployment scripts to include new dependencies
- [ ] 10.4 Add logging and monitoring for blog post generation jobs
- [ ] 10.5 Test deployment in staging environment
- [ ] 10.6 Document rollback procedures for database changes

## Notes
- All unit tests should live alongside the code they test
- Run tests with `pnpm test` and ensure coverage requirements are met
- Follow existing TypeScript patterns and linting rules
- Use existing UI component patterns from `components/ui/`
- Ensure all database operations use Drizzle ORM patterns
- Background jobs should use existing BullMQ retry and error handling
- Admin interface should be completely separate from user dashboard
- Markdown files should be stored in a version-controlled location
- All API responses should follow existing format and status code patterns
