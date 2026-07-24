ALTER TABLE "model_usage" ADD COLUMN "requests_used_minute" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "model_usage" ADD COLUMN "requests_used_day" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "model_usage" ADD COLUMN "tokens_used_day" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "model_usage" ADD COLUMN "minute_reset_at" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "model_usage" ADD COLUMN "day_reset_at" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "model_usage" DROP COLUMN "requests_used";--> statement-breakpoint
ALTER TABLE "model_usage" DROP COLUMN "tokens_used";