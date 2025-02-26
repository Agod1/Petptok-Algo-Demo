import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertMentorSchema, insertMenteeSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  app.get("/api/mentors", async (_req, res) => {
    const mentors = await storage.getMentors();
    res.json(mentors);
  });

  app.post("/api/mentors", async (req, res) => {
    const parsedData = insertMentorSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({ error: parsedData.error });
    }
    const mentor = await storage.createMentor(parsedData.data);
    res.json(mentor);
  });

  app.delete("/api/mentors", async (_req, res) => {
    await storage.clearMentors();
    res.json({ success: true });
  });

  app.get("/api/mentees", async (_req, res) => {
    const mentees = await storage.getMentees();
    res.json(mentees);
  });

  app.post("/api/mentees", async (req, res) => {
    const parsedData = insertMenteeSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({ error: parsedData.error });
    }
    const mentee = await storage.createMentee(parsedData.data);
    res.json(mentee);
  });

  app.delete("/api/mentees", async (_req, res) => {
    await storage.clearMentees();
    res.json({ success: true });
  });

  return createServer(app);
}
