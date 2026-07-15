CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE "document" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"name" text NOT NULL,
	"total_pages" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_chunk" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"chat_id" text NOT NULL,
	"content" text NOT NULL,
	"index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "embedding" (
	"id" text PRIMARY KEY NOT NULL,
	"chunk_id" text NOT NULL,
	"model" text NOT NULL,
	"vector" vector(768) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "embedding_chunk_id_unique" UNIQUE("chunk_id")
);
--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embedding" ADD CONSTRAINT "embedding_chunk_id_document_chunk_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."document_chunk"("id") ON DELETE cascade ON UPDATE no action;