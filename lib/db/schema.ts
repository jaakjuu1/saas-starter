import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
  GENERATE_REPORT = 'GENERATE_REPORT',
  DOWNLOAD_REPORT = 'DOWNLOAD_REPORT',
  SUBSCRIBE_DASHBOARD = 'SUBSCRIBE_DASHBOARD',
}

// Reports and Jobs schema
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id').references(() => teams.id),
  domain: varchar('domain', { length: 255 }).notNull(),
  reportType: varchar('report_type', { length: 50 }).notNull(), // 'lite', 'pro', 'elite', 'tasklist_pro'
  status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed'
  ga4PropertyId: varchar('ga4_property_id', { length: 100 }),
  reportData: text('report_data'), // JSON data
  error: text('error'), // Error message if generation failed
  pdfUrl: text('pdf_url'),
  stripePaymentId: text('stripe_payment_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});

export const reportJobs = pgTable('report_jobs', {
  id: serial('id').primaryKey(),
  reportId: integer('report_id')
    .notNull()
    .references(() => reports.id),
  jobId: text('job_id').notNull().unique(), // Queue job ID
  status: varchar('status', { length: 50 }).notNull().default('queued'), // 'queued', 'active', 'completed', 'failed'
  progress: integer('progress').default(0), // 0-100
  progressMessage: text('progress_message'), // Current progress description
  currentStage: varchar('current_stage', { length: 50 }), // Current execution stage
  executionEngine: varchar('execution_engine', { length: 20 }).default('legacy'), // 'legacy', 'langgraph'
  checkpointId: text('checkpoint_id'), // LangGraph checkpoint identifier
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const dashboardSubscriptions = pgTable('dashboard_subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id').references(() => teams.id),
  domain: varchar('domain', { length: 255 }).notNull(),
  ga4PropertyId: varchar('ga4_property_id', { length: 100 }),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  status: varchar('status', { length: 50 }).notNull().default('active'), // 'active', 'cancelled', 'past_due'
  planType: varchar('plan_type', { length: 50 }).notNull(), // 'basic', 'pro'
  lastDataRefresh: timestamp('last_data_refresh'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// LangGraph checkpoint storage
export const langGraphCheckpoints = pgTable('langgraph_checkpoints', {
  id: serial('id').primaryKey(),
  threadId: varchar('thread_id', { length: 255 }).notNull(),
  checkpointId: varchar('checkpoint_id', { length: 255 }).notNull(),
  parentCheckpointId: varchar('parent_checkpoint_id', { length: 255 }),
  checkpointData: jsonb('checkpoint_data').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const reportsRelations = relations(reports, ({ one, many }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [reports.teamId],
    references: [teams.id],
  }),
  reportJobs: many(reportJobs),
}));

export const reportJobsRelations = relations(reportJobs, ({ one }) => ({
  report: one(reports, {
    fields: [reportJobs.reportId],
    references: [reports.id],
  }),
}));

export const dashboardSubscriptionsRelations = relations(dashboardSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [dashboardSubscriptions.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [dashboardSubscriptions.teamId],
    references: [teams.id],
  }),
}));

// Type exports
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type ReportJob = typeof reportJobs.$inferSelect;
export type NewReportJob = typeof reportJobs.$inferInsert;
export type DashboardSubscription = typeof dashboardSubscriptions.$inferSelect;
export type NewDashboardSubscription = typeof dashboardSubscriptions.$inferInsert;
