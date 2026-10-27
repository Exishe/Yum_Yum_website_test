CREATE TABLE "blocked_phones" (
	"phone" text PRIMARY KEY NOT NULL,
	"reason" text,
	"blocked_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blocked_phones" ADD CONSTRAINT "blocked_phones_blocked_by_users_id_fk" FOREIGN KEY ("blocked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;