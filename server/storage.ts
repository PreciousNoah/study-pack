import { db } from "./db";
import { 
  studyPacks, 
  flashcards, 
  quizzes, 
  flashcardProgress,
  quizAttempts,
  type InsertStudyPack, 
  type InsertFlashcard, 
  type InsertQuiz,
  type InsertFlashcardProgress,
  type InsertQuizAttempt,
  type StudyPack, 
  type StudyPackWithContent 
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth/storage";

export interface IStorage {
  // Study Packs
  createStudyPack(pack: InsertStudyPack): Promise<StudyPack>;
  getStudyPack(id: number, userId?: string): Promise<StudyPackWithContent | undefined>;
  getUserStudyPacks(userId: string): Promise<StudyPack[]>;
  deleteStudyPack(id: number): Promise<void>;
  
  // Content
  createFlashcards(cards: InsertFlashcard[]): Promise<void>;
  createQuizzes(quizzes: InsertQuiz[]): Promise<void>;
  
  // Progress Tracking
  setFlashcardProgress(userId: string, flashcardId: number, mastered: boolean): Promise<void>;
  getFlashcardProgress(userId: string, flashcardId: number): Promise<any>;
  saveQuizAttempt(attempt: InsertQuizAttempt): Promise<void>;
  getQuizAttempts(userId: string, studyPackId: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async createStudyPack(pack: InsertStudyPack): Promise<StudyPack> {
    const [newPack] = await db.insert(studyPacks).values(pack).returning();
    return newPack;
  }

  async getStudyPack(id: number, userId?: string): Promise<StudyPackWithContent | undefined> {
    const [pack] = await db.select().from(studyPacks).where(eq(studyPacks.id, id));
    
    if (!pack) return undefined;

    const packFlashcards = await db.select().from(flashcards).where(eq(flashcards.studyPackId, id));
    const packQuizzes = await db.select().from(quizzes).where(eq(quizzes.studyPackId, id));

    // If userId provided, fetch progress
    let flashcardsWithProgress = packFlashcards;
    let progress = undefined;

    if (userId) {
      // Get flashcard progress
      const progressData = await db
        .select()
        .from(flashcardProgress)
        .where(eq(flashcardProgress.userId, userId));

      flashcardsWithProgress = packFlashcards.map((fc) => {
        const prog = progressData.find((p) => p.flashcardId === fc.id);
        return {
          ...fc,
          progress: prog ? { mastered: prog.mastered } : undefined,
        };
      });

      // Calculate progress stats
      const masteredCount = progressData.filter((p) => 
        packFlashcards.some((fc) => fc.id === p.flashcardId && p.mastered)
      ).length;

      // Get quiz attempts
      const attempts = await db
        .select()
        .from(quizAttempts)
        .where(
          and(
            eq(quizAttempts.userId, userId),
            eq(quizAttempts.studyPackId, id)
          )
        );

      const avgScore = attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
        : 0;

      progress = {
        masteredCount,
        totalFlashcards: packFlashcards.length,
        averageQuizScore: avgScore,
        lastAttempt: attempts[0],
        quizHistory: attempts.sort((a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime()),
      };
    }

    return {
      ...pack,
      flashcards: flashcardsWithProgress,
      quizzes: packQuizzes,
      progress,
    };
  }

  async getUserStudyPacks(userId: string): Promise<StudyPack[]> {
    return await db.select().from(studyPacks).where(eq(studyPacks.userId, userId));
  }

  async deleteStudyPack(id: number): Promise<void> {
    await db.delete(studyPacks).where(eq(studyPacks.id, id));
  }

  async createFlashcards(cards: InsertFlashcard[]): Promise<void> {
    if (cards.length === 0) return;
    await db.insert(flashcards).values(cards);
  }

  async createQuizzes(quizData: InsertQuiz[]): Promise<void> {
    if (quizData.length === 0) return;
    await db.insert(quizzes).values(quizData);
  }

  // Progress tracking
  async setFlashcardProgress(userId: string, flashcardId: number, mastered: boolean): Promise<void> {
    const existing = await db
      .select()
      .from(flashcardProgress)
      .where(
        and(
          eq(flashcardProgress.userId, userId),
          eq(flashcardProgress.flashcardId, flashcardId)
        )
      );

    if (existing.length > 0) {
      await db
        .update(flashcardProgress)
        .set({ mastered, lastReviewed: new Date() })
        .where(
          and(
            eq(flashcardProgress.userId, userId),
            eq(flashcardProgress.flashcardId, flashcardId)
          )
        );
    } else {
      await db.insert(flashcardProgress).values({
        userId,
        flashcardId,
        mastered,
      });
    }
  }

  async getFlashcardProgress(userId: string, flashcardId: number) {
    const [progress] = await db
      .select()
      .from(flashcardProgress)
      .where(
        and(
          eq(flashcardProgress.userId, userId),
          eq(flashcardProgress.flashcardId, flashcardId)
        )
      );
    return progress;
  }

  async saveQuizAttempt(attempt: InsertQuizAttempt): Promise<void> {
    await db.insert(quizAttempts).values(attempt);
  }

  async getQuizAttempts(userId: string, studyPackId: number) {
    return await db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.studyPackId, studyPackId)
        )
      );
  }
}

export const storage = new DatabaseStorage();