import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { registerAuthRoutes } from "./replit_integrations/auth";
import { openai } from "./replit_integrations/audio/client"; // Re-using openai client from integration

// Dynamic import for pdf-parse to handle ESM/CommonJS compatibility
let pdfParse: any;

async function initPdfParse() {
  if (!pdfParse) {
    try {
      const module = await import("pdf-parse");
      pdfParse = module.default || module;
      console.log("pdf-parse loaded successfully");
    } catch (e) {
      console.error("Failed to load pdf-parse:", e);
      throw e;
    }
  }
  return pdfParse;
}

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // === API ROUTES ===

  // List Study Packs
  app.get(api.studyPacks.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const packs = await storage.getUserStudyPacks(userId);
    res.json(packs);
  });

  // Get Study Pack
  app.get(api.studyPacks.get.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const packId = parseInt(req.params.id);
    
    if (isNaN(packId)) {
        return res.status(404).json({ message: "Invalid ID" });
    }

    const pack = await storage.getStudyPack(packId);

    if (!pack) {
      return res.status(404).json({ message: "Study pack not found" });
    }

    if (pack.userId !== userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.json(pack);
  });

  // Delete Study Pack
  app.delete(api.studyPacks.delete.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const packId = parseInt(req.params.id);

    if (isNaN(packId)) {
        return res.status(404).json({ message: "Invalid ID" });
    }

    const pack = await storage.getStudyPack(packId);

    if (!pack) {
        return res.status(404).json({ message: "Study pack not found" });
    }

    if (pack.userId !== userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    await storage.deleteStudyPack(packId);
    res.sendStatus(204);
  });

  // Generate Study Pack
  app.post(api.studyPacks.create.path, isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({ message: "Only PDF files are allowed" });
      }

      const userId = (req.user as any).claims.sub;
      const pdfBuffer = req.file.buffer;
      
      // Extract text
      let pdfData;
      try {
          console.log("Attempting to parse PDF, buffer size:", pdfBuffer.length);
          const parsePdf = await initPdfParse();
          pdfData = await parsePdf(pdfBuffer);
          console.log("PDF parsed successfully, text length:", pdfData.text?.length || 0);
      } catch (e: any) {
          console.error("PDF Parse Error:", e.message, e.stack);
          return res.status(500).json({ 
              message: "Failed to parse PDF. The file might be encrypted, corrupted, or not a valid PDF.",
              error: e.message 
          });
      }
      
      const textContent = pdfData.text;

      if (!textContent || textContent.trim().length === 0) {
          return res.status(400).json({ message: "Could not extract text from PDF. It might be scanned or empty." });
      }

      // Call OpenAI
      const prompt = `
        You are a study assistant. 
        From the material below:
        1. Create a concise summary.
        2. Generate 10 flashcards (Q&A format).
        3. Generate 5 multiple choice practice questions (quizzes) with options and the correct answer.

        Material:
        ${textContent.slice(0, 15000)} // Limit text length to avoid token limits

        Respond ONLY with a valid JSON object in this format:
        {
          "summary": "...",
          "flashcards": [
            { "question": "...", "answer": "..." }
          ],
          "quizzes": [
            { "question": "...", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": "Option A" }
          ]
        }
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const generatedContent = JSON.parse(completion.choices[0].message.content || "{}");

      // Validate structure roughly
      if (!generatedContent.summary || !generatedContent.flashcards || !generatedContent.quizzes) {
          throw new Error("Invalid response from AI");
      }

      // Save to DB
      const pack = await storage.createStudyPack({
        userId,
        title: req.file.originalname.replace(".pdf", ""),
        originalFileName: req.file.originalname,
        summary: generatedContent.summary,
      });

      if (generatedContent.flashcards.length > 0) {
        await storage.createFlashcards(generatedContent.flashcards.map((fc: any) => ({
            studyPackId: pack.id,
            question: fc.question,
            answer: fc.answer
        })));
      }

      if (generatedContent.quizzes.length > 0) {
        await storage.createQuizzes(generatedContent.quizzes.map((q: any) => ({
            studyPackId: pack.id,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer
        })));
      }

      const fullPack = await storage.getStudyPack(pack.id);
      res.status(201).json(fullPack);

    } catch (error) {
      console.error("Generation error:", error);
      res.status(500).json({ message: "Failed to generate study pack" });
    }
  });

  return httpServer;
}
