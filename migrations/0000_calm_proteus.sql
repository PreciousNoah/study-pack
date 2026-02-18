CREATE TABLE "flashcards" (
	"id" serial PRIMARY KEY NOT NULL,
	"study_pack_id" integer NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" serial PRIMARY KEY NOT NULL,
	"study_pack_id" integer NOT NULL,
	"question" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_answer" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_packs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"original_file_name" text NOT NULL,
	"summary" text,
	"difficulty" text DEFAULT 'Medium',
	"summary_length" text DEFAULT 'Medium',
	"flashcard_count" integer DEFAULT 10,
	"quiz_count" integer DEFAULT 5,
	"topics" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_study_pack_id_study_packs_id_fk" FOREIGN KEY ("study_pack_id") REFERENCES "public"."study_packs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_study_pack_id_study_packs_id_fk" FOREIGN KEY ("study_pack_id") REFERENCES "public"."study_packs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");