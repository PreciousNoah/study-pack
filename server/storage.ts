import { db } from "./db";
import { studyPacks, flashcards, quizzes, type InsertStudyPack, type InsertFlashcard, type InsertQuiz, type StudyPack, type StudyPackWithContent } from "@shared/schema";
import { eq } from "drizzle-orm";

// Import auth storage to verify it exists/is accessible if needed, 
// though we can just use the auth module's storage for user ops.
import { authStorage } from "./replit_integrations/auth/storage";

export interface IStorage {
  // Study Packs
  createStudyPack(pack: InsertStudyPack): Promise<StudyPack>;
  getStudyPack(id: number): Promise<StudyPackWithContent | undefined>;
  getUserStudyPacks(userId: string): Promise<StudyPack[]>;
  deleteStudyPack(id: number): Promise<void>;

  // Content
  createFlashcards(cards: InsertFlashcard[]): Promise<void>;
  createQuizzes(quizzes: InsertQuiz[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createStudyPack(pack: InsertStudyPack): Promise<StudyPack> {
    const [newPack] = await db.insert(studyPacks).values(pack).returning();
    return newPack;
  }

  async getStudyPack(id: number): Promise<StudyPackWithContent | undefined> {
    const [pack] = await db.select().from(studyPacks).where(eq(studyPacks.id, id));
    
    if (!pack) return undefined;

    const packFlashcards = await db.select().from(flashcards).where(eq(flashcards.studyPackId, id));
    const packQuizzes = await db.select().from(quizzes).where(eq(quizzes.studyPackId, id));

    return {
      ...pack,
      flashcards: packFlashcards,
      quizzes: packQuizzes,
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
}

export const storage = new DatabaseStorage();
