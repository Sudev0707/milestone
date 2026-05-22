export type TopicStatus = "not-started" | "in-progress" | "completed" | "revision";
export type Difficulty = "easy" | "medium" | "hard";
export type ProblemStatus = "todo" | "solved" | "review";

export interface Problem {
  id: string;
  topicId: string;
  title: string;
  difficulty: Difficulty;
  status: ProblemStatus;
  notes?: string;
  retries: number;
  tags: string[];
  references?: string[];
  createdAt: number;
  completedAt?: number;
}


export interface Topic {
  id: string;
  parentId: string | null;
  title: string;
  description?: string;
  /** Comma-separated / free-form tags saved explicitly */
  tags?: string[];
  /** Optional resource URL */
  url?: string;
  status: TopicStatus;
  notes: string;
  order: number;
  createdAt: number;
  updatedAt: number;
  lastStudiedAt?: number;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetHours: number;
  loggedHours: number;
  deadline?: string; // ISO date
  completed: boolean;
  createdAt: number;
}

export interface FocusSession {
  id: string;
  startedAt: number;
  endedAt: number;
  durationSec: number;
  mode: "focus" | "short-break" | "long-break";
  topicId?: string;
}

export interface PlannerTask {
  id: string;
  title: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  order: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt?: number;
  icon: string;
}

export interface ActivityLog {
  id: string;
  type: "topic-completed" | "problem-solved" | "focus-session" | "goal-completed" | "note-edited";
  ref?: string;
  label: string;
  at: number;
}
