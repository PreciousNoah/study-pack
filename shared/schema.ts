import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

// Export auth models so they are available
export * from "./models/auth";

// === TABLE DEFINITIONS ===
export const studyPacks = pgTable("study_packs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  originalFileName: text("original_file_name").notNull(),
  summary: text("summary"),
  difficulty: text("difficulty").default("Medium"),
  summaryLength: text("summary_length").default("Medium"),
  flashcardCount: integer("flashcard_count").default(10),
  quizCount: integer("quiz_count").default(5),
  topics: jsonb("topics").default([]),
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
  options: jsonb("options").notNull(),
  correctAnswer: text("correct_answer").notNull(),
});

// === PROGRESS TRACKING TABLES ===
export const flashcardProgress = pgTable("flashcard_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  flashcardId: integer("flashcard_id").notNull().references(() => flashcards.id, { onDelete: 'cascade' }),
  mastered: boolean("mastered").default(false),
  lastReviewed: timestamp("last_reviewed").defaultNow(),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  studyPackId: integer("study_pack_id").notNull().references(() => studyPacks.id, { onDelete: 'cascade' }),
  score: integer("score").notNull(), // percentage 0-100
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  attemptedAt: timestamp("attempted_at").defaultNow(),
});

// === SCHEMAS ===
export const insertStudyPackSchema = createInsertSchema(studyPacks).omit({ id: true, createdAt: true });
export const insertFlashcardSchema = createInsertSchema(flashcards).omit({ id: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true });
export const insertFlashcardProgressSchema = createInsertSchema(flashcardProgress).omit({ id: true, lastReviewed: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true, attemptedAt: true });

// === TYPES ===
export type StudyPack = typeof studyPacks.$inferSelect;
export type InsertStudyPack = z.infer<typeof insertStudyPackSchema>;
export type Flashcard = typeof flashcards.$inferSelect;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type FlashcardProgress = typeof flashcardProgress.$inferSelect;
export type InsertFlashcardProgress = z.infer<typeof insertFlashcardProgressSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;

// Complex types for responses
export type FlashcardWithProgress = Flashcard & {
  progress?: FlashcardProgress;
};

export type StudyPackWithContent = StudyPack & {
  flashcards: FlashcardWithProgress[];
  quizzes: Quiz[];
  progress?: {
    masteredCount: number;
    totalFlashcards: number;
    averageQuizScore: number;
    lastAttempt?: QuizAttempt;
  };
};

export type GeneratedContent = {
  summary: string;
  flashcards: { question: string; answer: string }[];
  quizzes: { question: string; options: string[]; correctAnswer: string }[];
};