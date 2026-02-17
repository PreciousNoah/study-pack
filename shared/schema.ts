import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth"; // Import users from auth schema

// Export auth models so they are available
export * from "./models/auth";

// === TABLE DEFINITIONS ===

export const studyPacks = pgTable("study_packs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Links to auth users.id (which is a string)
  title: text("title").notNull(),
  originalFileName: text("original_file_name").notNull(),
  summary: text("summary"), // AI generated summary
  difficulty: text("difficulty").default("Medium"),
  summaryLength: text("summary_length").default("Medium"),
  flashcardCount: integer("flashcard_count").default(10),
  quizCount: integer("quiz_count").default(5),
  topics: jsonb("topics").default([]), // Array of strings
  createdAt: timestamp("created_at").defaultNow(),
});

export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  studyPackId: integer("study_pack_id").notNull().references(() => studyPacks.id, { onDelete: 'cascade' }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  studyPackId: integer("study_pack_id").notNull().references(() => studyPacks.id, { onDelete: 'cascade' }),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // Array of strings
  correctAnswer: text("correct_answer").notNull(),
});

// === SCHEMAS ===

export const insertStudyPackSchema = createInsertSchema(studyPacks).omit({ id: true, createdAt: true });
export const insertFlashcardSchema = createInsertSchema(flashcards).omit({ id: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true });

// === TYPES ===

export type StudyPack = typeof studyPacks.$inferSelect;
export type InsertStudyPack = z.infer<typeof insertStudyPackSchema>;

export type Flashcard = typeof flashcards.$inferSelect;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;

// Complex types for responses
export type StudyPackWithContent = StudyPack & {
  flashcards: Flashcard[];
  quizzes: Quiz[];
};

// AI Generation Response Type
export type GeneratedContent = {
  summary: string;
  flashcards: { question: string; answer: string }[];
  quizzes: { question: string; options: string[]; correctAnswer: string }[];
};
