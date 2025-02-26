import type { Mentor, Mentee, MatchWeights } from "@shared/schema";
import { MBTI_PAIRINGS } from "./config";

export function calculateMatch(mentor: Mentor, mentee: Mentee, weights: MatchWeights, ): number {
  let score = 0;
  let mbtiPairings: Record<string, string[]> = MBTI_PAIRINGS;

  // MBTI Compatibility Score
  if (mbtiPairings[mentee.mbti]?.includes(mentor.mbti)) {
    score += ((3 - mbtiPairings[mentee.mbti].indexOf(mentor.mbti) + 1) / 3) * weights.mbti;
  }

  // Skills Match Score (Overlap of Preferred Skills & Mentor Skills)
  const menteeSkills = new Set(mentee.preferred_skills);
  const mentorSkills = new Set(mentor.skills);
  const skillMatchScore = (menteeSkills.size && mentorSkills.size)
    ? (Array.from(menteeSkills).filter(skill => mentorSkills.has(skill)).length / menteeSkills.size) * weights.skills
    : 0;
  score += skillMatchScore;

  // Industry Match
  if (mentee.industry === mentor.industry) {
    score += weights.industry;
  }

  // Location Match
  if (mentee.location === mentor.location) {
    score += weights.location;
  }

  // Experience Level Difference (mentor's experience levels should be greater than mentee's)
  score += (mentor.experience_Level > mentee.experience_Level ? 1 : 0) * weights.experience_Level;

  // Return score
  return score;
}

export function findBestMatches(mentors: Mentor[], mentee: Mentee, weights: MatchWeights): Mentor[] {
  const matches = mentors.map(mentor => ({
    mentor,
    score: calculateMatch(mentor, mentee, weights)
  }));

  return matches
    .sort((a, b) => b.score - a.score)
    .map(m => m.mentor);
}
