import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { registerAuthRoutes } from "./replit_integrations/auth";
import Groq from "groq-sdk";
import mammoth from "mammoth";
import ExcelJS from "exceljs";
import PDFExtract from 'pdf.js-extract';

const pdfExtract = new (PDFExtract as any).PDFExtract();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

async function extractTextFromFile(buffer: Buffer, mimetype: string, filename: string): Promise<string> {
  if (mimetype === "application/pdf" || filename.toLowerCase().endsWith(".pdf")) {
    try {
      const data = await pdfExtract.extractBuffer(buffer);
      const text = data.pages
        .map((page: any) => page.content.map((item: any) => item.str).join(' '))
        .join('\n');
      
      if (!text || text.trim().length === 0) {
        throw new Error("PDF contains no extractable text (possibly scanned image).");
      }
      return text;
    } catch (error: any) {
      console.error("PDF parsing error:", error);
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }
  
  if (mimetype === "text/plain") {
    return buffer.toString("utf-8");
  }
  
  if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  
  if (mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer);
    let text = "";
    
    const slideFiles = Object.keys(zip.files).filter(name => name.startsWith("ppt/slides/slide"));
    for (const slideFile of slideFiles) {
      const content = await zip.file(slideFile)?.async("string");
      if (content) {
        const matches = content.match(/<a:t>(.*?)<\/a:t>/g);
        if (matches) {
          matches.forEach(match => {
            const cleanText = match.replace(/<\/?a:t>/g, "");
            text += cleanText + " ";
          });
        }
      }
    }
    return text;
  }
  
  if (mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    let text = "";
    
    workbook.eachSheet((worksheet, sheetId) => {
      text += `Sheet: ${worksheet.name}\n`;
      worksheet.eachRow((row, rowNumber) => {
        const values = row.values as any[];
        text += values.slice(1).join(" | ") + "\n";
      });
    });
    return text;
  }
  
  throw new Error(`Unsupported file type: ${mimetype}`);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get(api.studyPacks.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const packs = await storage.getUserStudyPacks(userId);
    res.json(packs);
  });

  app.get(api.studyPacks.get.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const packId = parseInt(req.params.id as string);
    if (isNaN(packId)) return res.status(404).json({ message: "Invalid ID" });
    const pack = await storage.getStudyPack(packId, userId);
    if (!pack) return res.status(404).json({ message: "Study pack not found" });
    if (pack.userId !== userId) return res.status(401).json({ message: "Unauthorized" });
    res.json(pack);
  });

  app.delete(api.studyPacks.delete.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const packId = parseInt(req.params.id as string);
    if (isNaN(packId)) return res.status(404).json({ message: "Invalid ID" });
    const pack = await storage.getStudyPack(packId);
    if (!pack) return res.status(404).json({ message: "Study pack not found" });
    if (pack.userId !== userId) return res.status(401).json({ message: "Unauthorized" });
    await storage.deleteStudyPack(packId);
    res.sendStatus(204);
  });

  app.post(api.studyPacks.create.path, isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      const { difficulty = "Medium", summaryLength = "Medium", flashcardCount = 10, quizCount = 5, textInput } = req.body;
      const userId = (req.user as any).id;
      let textContent = "";
      let fileName = "Pasted Content";

      if (req.file) {
        fileName = req.file.originalname;
        try {
          textContent = await extractTextFromFile(req.file.buffer, req.file.mimetype, fileName);
        } catch (e: any) {
          return res.status(400).json({ message: e.message });
        }
      } else if (textInput) {
        textContent = textInput;
        fileName = "Text Input";
      } else {
        return res.status(400).json({ message: "No content provided" });
      }

      if (!textContent || textContent.trim().length < 50) {
        return res.status(400).json({ message: "Content is too short to generate study materials." });
      }

      const prompt = `
        You are a study assistant. 
        From the material below:
        1. Create a ${summaryLength} length concise summary.
        2. Generate ${flashcardCount} flashcards (Q&A format).
        3. Generate ${quizCount} multiple choice practice questions (quizzes) at ${difficulty} difficulty with options and the correct answer.
        4. Extract 5-8 key topics or keywords.
        Material:
        ${textContent.slice(0, 15000)}
        Respond ONLY with a valid JSON object in this exact format, no markdown, no backticks:
        {
          "summary": "...",
          "topics": ["topic1", "topic2"],
          "flashcards": [
            { "question": "...", "answer": "..." }
          ],
          "quizzes": [
            { "question": "...", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": "Option A" }
          ]
        }
      `;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const generatedContent = JSON.parse(completion.choices[0].message.content || "{}");

      if (!generatedContent.summary || !generatedContent.flashcards || !generatedContent.quizzes) {
        throw new Error("Invalid response from AI");
      }

      const pack = await storage.createStudyPack({
        userId,
        title: fileName.replace(/\.[^/.]+$/, ""),
        originalFileName: fileName,
        summary: generatedContent.summary,
        difficulty,
        summaryLength,
        flashcardCount: Number(flashcardCount),
        quizCount: Number(quizCount),
        topics: generatedContent.topics || [],
      });

      await storage.createFlashcards(generatedContent.flashcards.map((fc: any) => ({
        studyPackId: pack.id,
        question: fc.question,
        answer: fc.answer
      })));

      await storage.createQuizzes(generatedContent.quizzes.map((q: any) => ({
        studyPackId: pack.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer
      })));

      const fullPack = await storage.getStudyPack(pack.id);
      res.status(201).json(fullPack);
    } catch (error: any) {
      console.error("Generation error:", error);
      res.status(500).json({ message: "Failed to generate study pack: " + error.message });
    }
  });

  app.post("/api/user/avatar", isAuthenticated, upload.single("avatar"), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const avatarBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      res.json({ avatarUrl: avatarBase64 });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to upload avatar: " + error.message });
    }
  });

  app.post("/api/flashcards/progress", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { flashcardId, mastered } = req.body;

      await storage.setFlashcardProgress(userId, flashcardId, mastered);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update progress: " + error.message });
    }
  });

  app.post("/api/quiz/attempt", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { studyPackId, score, totalQuestions, correctAnswers } = req.body;

      await storage.saveQuizAttempt({
        userId,
        studyPackId,
        score,
        totalQuestions,
        correctAnswers,
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to save quiz attempt: " + error.message });
    }
  });

  app.post("/api/explain", isAuthenticated, async (req, res) => {
    try {
      const { text, context } = req.body;
      if (!text || text.length < 5) {
        return res.status(400).json({ message: "Text too short to explain." });
      }

      const prompt = `
        Explain the following text in simpler terms. 
        Context of the study material: ${context || "General"}
        Text to explain: "${text}"
        Provide a clear, simple explanation.
      `;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
      });

      res.json({ explanation: completion.choices[0].message.content });
    } catch (error: any) {
      res.status(500).json({ message: "Explanation failed: " + error.message });
    }
  });

  return httpServer;
}