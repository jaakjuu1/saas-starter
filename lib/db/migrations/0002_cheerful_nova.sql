CREATE TABLE "langgraph_checkpoints" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" varchar(255) NOT NULL,
	"checkpoint_id" varchar(255) NOT NULL,
	"parent_checkpoint_id" varchar(255),
	"checkpoint_data" jsonb NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "report_jobs" ADD COLUMN "progress_message" text;--> statement-breakpoint
ALTER TABLE "report_jobs" ADD COLUMN "current_stage" varchar(50);--> statement-breakpoint
ALTER TABLE "report_jobs" ADD COLUMN "execution_engine" varchar(20) DEFAULT 'legacy';--> statement-breakpoint
ALTER TABLE "report_jobs" ADD COLUMN "checkpoint_id" text;--> statement-breakpoint
ALTER TABLE "report_jobs" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "error" text;