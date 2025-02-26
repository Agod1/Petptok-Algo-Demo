// export const API_BASE_URL = process.env.BE_API_BASE_URL || "http://localhost:5000";
export const API_BASE_URL = "http://localhost:5000";
export const REMOTE_MATCH_URL = "http://192.168.2.10/:5050/api/v0.1/accounts/match";
export const USE_REMOTE = false;

export const MBTI_PAIRINGS: Record<string, string[]> = {
    "ENFJ": ["INFJ", "ENTJ", "ENFP"],
    "ENFP": ["INFJ", "ENFJ", "INTP"],
    "ENTJ": ["INTJ", "ESTJ", "ENTP"],
    "ENTP": ["INTP", "ENTJ", "ENFJ"],
    "ESFJ": ["ISFJ", "ENFJ", "ESTJ"],
    "ESFP": ["ISFP", "ESFJ", "ENFJ"],
    "ESTJ": ["ISTJ", "ENTJ", "ENTP"],
    "ESTP": ["ISTP", "ENTJ", "ESTJ"],
    "INFJ": ["ENFJ", "INTJ", "ENTJ"],
    "INFP": ["INFJ", "ENFJ", "ENFP"],
    "INTJ": ["ENTP", "ENTJ", "INTP"],
    "INTP": ["ENTP", "INTJ", "ENFP"],
    "ISFJ": ["ESFJ", "ENFJ", "ISTJ"],
    "ISFP": ["ESFP", "INFP", "ENFP"],
    "ISTJ": ["ESTJ", "ENTJ", "ISFJ"],
    "ISTP": ["ESTP", "ISTJ", "INTP"],
  };