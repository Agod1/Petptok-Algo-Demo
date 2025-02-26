import { type Mentor, type InsertMentor, type Mentee, type InsertMentee } from "@shared/schema";

export interface IStorage {
  // Mentor operations
  getMentors(): Promise<Mentor[]>;
  createMentor(mentor: InsertMentor): Promise<Mentor>;
  clearMentors(): Promise<void>;
  
  // Mentee operations  
  getMentees(): Promise<Mentee[]>;
  createMentee(mentee: InsertMentee): Promise<Mentee>;
  clearMentees(): Promise<void>;
}

export class MemStorage implements IStorage {
  private mentors: Map<number, Mentor>;
  private mentees: Map<number, Mentee>;
  private mentorId: number;
  private menteeId: number;

  constructor() {
    this.mentors = new Map();
    this.mentees = new Map();
    this.mentorId = 1;
    this.menteeId = 1;
  }

  async getMentors(): Promise<Mentor[]> {
    return Array.from(this.mentors.values());
  }

  async createMentor(insertMentor: InsertMentor): Promise<Mentor> {
    const id = this.mentorId++;
    const mentor = { ...insertMentor, id };
    this.mentors.set(id, mentor);
    return mentor;
  }

  async clearMentors(): Promise<void> {
    this.mentors.clear();
    this.mentorId = 1;
  }

  async getMentees(): Promise<Mentee[]> {
    return Array.from(this.mentees.values());
  }

  async createMentee(insertMentee: InsertMentee): Promise<Mentee> {
    const id = this.menteeId++;
    const mentee = { ...insertMentee, id };
    this.mentees.set(id, mentee);
    return mentee;
  }

  async clearMentees(): Promise<void> {
    this.mentees.clear();
    this.menteeId = 1;
  }
}

export const storage = new MemStorage();
