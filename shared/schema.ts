import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const mentors = pgTable("mentors", {
  id: serial("id").primaryKey(),
  last_work_role: text("last_work_role").notNull(),
  skills: text("skills").array().notNull(),
  max_match: integer("max_match").notNull(),
  interests: text("interests").array().notNull(),
  industry_specific_needs: text("industry_specific_needs").array().notNull(),
  location: text("location").notNull(),
  mbti: text("mbti").notNull(),
});

export const mentees = pgTable("mentees", {
  id: serial("id").primaryKey(),
  career_goals: text("career_goals").array().notNull(),
  preferred_skills: text("preferred_skills").array().notNull(),
  industry_specific_needs: text("industry_specific_needs").array().notNull(),
  interests: text("interests").array().notNull(),
  last_work_role: text("last_work_role").notNull(),
  location: text("location").notNull(),
  mbti: text("mbti").notNull(),
});

export const insertMentorSchema = createInsertSchema(mentors).omit({ id: true });
export const insertMenteeSchema = createInsertSchema(mentees).omit({ id: true });

export type InsertMentor = z.infer<typeof insertMentorSchema>;
export type InsertMentee = z.infer<typeof insertMenteeSchema>;
export type Mentor = typeof mentors.$inferSelect;
export type Mentee = typeof mentees.$inferSelect;

export const matchWeightSchema = z.object({
  skills: z.number().min(0).max(1),
  location: z.number().min(0).max(1),
  interests: z.number().min(0).max(1),
  industryNeeds: z.number().min(0).max(1),
  mbti: z.number().min(0).max(1),
});

export type MatchWeights = z.infer<typeof matchWeightSchema>;
