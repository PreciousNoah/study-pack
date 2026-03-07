CREATE TABLE "essay_prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"study_pack_id" integer NOT NULL,
	"prompt" text NOT NULL,
	"key_points" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "short_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"study_pack_id" integer NOT NULL,
	"question" text NOT NULL,
	"sample_answer" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "study_packs" ADD COLUMN "key_concepts" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "essay_prompts" ADD CONSTRAINT "essay_prompts_study_pack_id_study_packs_id_fk" FOREIGN KEY ("study_pack_id") REFERENCES "public"."study_packs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "short_answers" ADD CONSTRAINT "short_answers_study_pack_id_study_packs_id_fk" FOREIGN KEY ("study_pack_id") REFERENCES "public"."study_packs"("id") ON DELETE cascade ON UPDATE no action;