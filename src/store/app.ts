import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { uid } from "@/lib/id";
import type {
  Topic, Problem, Goal, FocusSession, PlannerTask, Achievement, ActivityLog,
  TopicStatus, Difficulty, ProblemStatus,
} from "@/types";

export type View =
  | "dashboard" | "roadmap" | "problems" | "notes"
  | "goals" | "focus" | "analytics" | "planner" | "settings";

export type Theme = "light" | "dark";

interface Settings {
  theme: Theme;
  focusDuration: number; // minutes
  shortBreak: number;
  longBreak: number;
  longBreakEvery: number;
}

interface State {
  hydrated: boolean;
  view: View;
  activeTopicId: string | null;
  search: string;
  paletteOpen: boolean;

  settings: Settings;
  topics: Topic[];
  problems: Problem[];
  goals: Goal[];
  sessions: FocusSession[];
  planner: PlannerTask[];
  achievements: Achievement[];
  activity: ActivityLog[];
  xp: number;

  // actions
  setView: (v: View) => void;
  setActiveTopic: (id: string | null) => void;
  setSearch: (s: string) => void;
  togglePalette: (open?: boolean) => void;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  updateSettings: (p: Partial<Settings>) => void;

  addTopic: (input: { title: string; parentId?: string | null; description?: string }) => Topic;
  updateTopic: (id: string, patch: Partial<Topic>) => void;
  deleteTopic: (id: string) => void;
  setTopicStatus: (id: string, status: TopicStatus) => void;
  reorderTopics: (parentId: string | null, orderedIds: string[]) => void;
  setTopicNotes: (id: string, notes: string) => void;

  addProblem: (input: { topicId: string; title: string; difficulty: Difficulty; tags?: string[]; notes?: string }) => void;
  updateProblem: (id: string, patch: Partial<Problem>) => void;
  deleteProblem: (id: string) => void;
  toggleProblemSolved: (id: string) => void;
  setProblemStatus: (id: string, status: ProblemStatus) => void;

  addGoal: (input: { title: string; targetHours: number; deadline?: string; description?: string }) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleGoal: (id: string) => void;
  logGoalHours: (id: string, hours: number) => void;

  addSession: (s: Omit<FocusSession, "id">) => void;

  addPlannerTask: (title: string, date?: string) => void;
  togglePlannerTask: (id: string) => void;
  deletePlannerTask: (id: string) => void;
  reorderPlanner: (date: string, orderedIds: string[]) => void;

  pushActivity: (a: Omit<ActivityLog, "id" | "at"> & { at?: number }) => void;
  unlockAchievement: (id: string) => void;
  addXp: (n: number) => void;

  exportAll: () => string;
  importAll: (json: string) => boolean;
  resetAll: () => void;
}

const seedAchievements = (): Achievement[] => [
  { id: "first-topic", title: "First Steps", description: "Create your first topic", icon: "Sparkles" },
  { id: "first-completed", title: "Topic Conqueror", description: "Complete a topic", icon: "Trophy" },
  { id: "ten-problems", title: "Problem Crusher", description: "Solve 10 problems", icon: "Swords" },
  { id: "first-session", title: "Deep Work", description: "Finish a focus session", icon: "Timer" },
  { id: "streak-7", title: "Week Warrior", description: "7-day streak", icon: "Flame" },
  { id: "first-goal", title: "Goal Setter", description: "Complete a goal", icon: "Target" },
];

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      view: "dashboard",
      activeTopicId: null,
      search: "",
      paletteOpen: false,

      settings: {
        theme: "dark",
        focusDuration: 25,
        shortBreak: 5,
        longBreak: 15,
        longBreakEvery: 4,
      },
      topics: [],
      problems: [],
      goals: [],
      sessions: [],
      planner: [],
      achievements: seedAchievements(),
      activity: [],
      xp: 0,

      setView: (view) => set({ view }),
      setActiveTopic: (id) => set({ activeTopicId: id }),
      setSearch: (search) => set({ search }),
      togglePalette: (open) =>
        set((s) => ({ paletteOpen: open ?? !s.paletteOpen })),
      toggleTheme: () =>
        set((s) => ({ settings: { ...s.settings, theme: s.settings.theme === "dark" ? "light" : "dark" } })),
      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),
      updateSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),

      addTopic: ({ title, parentId = null, description }) => {
        const now = Date.now();
        const siblings = get().topics.filter((t) => t.parentId === parentId);
        const topic: Topic = {
          id: uid(),
          parentId,
          title,
          description,
          status: "not-started",
          notes: "",
          order: siblings.length,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ topics: [...s.topics, topic] }));
        get().pushActivity({ type: "note-edited", ref: topic.id, label: `Added topic "${title}"` });
        if (get().topics.length === 1) get().unlockAchievement("first-topic");
        get().addXp(10);
        return topic;
      },
      updateTopic: (id, patch) =>
        set((s) => ({
          topics: s.topics.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)),
        })),
      deleteTopic: (id) => {
        const collect = (rootId: string): string[] => {
          const children = get().topics.filter((t) => t.parentId === rootId);
          return [rootId, ...children.flatMap((c) => collect(c.id))];
        };
        const ids = collect(id);
        set((s) => ({
          topics: s.topics.filter((t) => !ids.includes(t.id)),
          problems: s.problems.filter((p) => !ids.includes(p.topicId)),
          activeTopicId: ids.includes(s.activeTopicId ?? "") ? null : s.activeTopicId,
        }));
      },
      setTopicStatus: (id, status) => {
        const prev = get().topics.find((t) => t.id === id);
        set((s) => ({
          topics: s.topics.map((t) =>
            t.id === id ? { ...t, status, updatedAt: Date.now(), lastStudiedAt: Date.now() } : t,
          ),
        }));
        if (status === "completed" && prev?.status !== "completed") {
          get().pushActivity({ type: "topic-completed", ref: id, label: `Completed "${prev?.title}"` });
          get().unlockAchievement("first-completed");
          get().addXp(50);
        }
      },
      reorderTopics: (parentId, orderedIds) =>
        set((s) => ({
          topics: s.topics.map((t) => {
            if (t.parentId !== parentId) return t;
            const idx = orderedIds.indexOf(t.id);
            return idx === -1 ? t : { ...t, order: idx };
          }),
        })),
      setTopicNotes: (id, notes) => {
        set((s) => ({
          topics: s.topics.map((t) =>
            t.id === id ? { ...t, notes, updatedAt: Date.now(), lastStudiedAt: Date.now() } : t,
          ),
        }));
      },

      addProblem: ({ topicId, title, difficulty, tags = [], notes }) => {
        const p: Problem = {
          id: uid(), topicId, title, difficulty, status: "todo",
          retries: 0, tags, notes, createdAt: Date.now(),
        };
        set((s) => ({ problems: [p, ...s.problems] }));
        get().addXp(5);
      },
      updateProblem: (id, patch) =>
        set((s) => ({ problems: s.problems.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deleteProblem: (id) =>
        set((s) => ({ problems: s.problems.filter((p) => p.id !== id) })),
      toggleProblemSolved: (id) => {
        const p = get().problems.find((x) => x.id === id);
        if (!p) return;
        const newStatus: ProblemStatus = p.status === "solved" ? "todo" : "solved";
        set((s) => ({
          problems: s.problems.map((x) =>
            x.id === id ? { ...x, status: newStatus, completedAt: newStatus === "solved" ? Date.now() : undefined } : x,
          ),
        }));
        if (newStatus === "solved") {
          get().pushActivity({ type: "problem-solved", ref: id, label: `Solved "${p.title}"` });
          get().addXp(15);
          const solved = get().problems.filter((x) => x.status === "solved").length;
          if (solved >= 10) get().unlockAchievement("ten-problems");
        }
      },
      setProblemStatus: (id, status) =>
        set((s) => ({ problems: s.problems.map((p) => (p.id === id ? { ...p, status } : p)) })),

      addGoal: ({ title, targetHours, deadline, description }) => {
        const g: Goal = {
          id: uid(), title, targetHours, deadline, description,
          loggedHours: 0, completed: false, createdAt: Date.now(),
        };
        set((s) => ({ goals: [g, ...s.goals] }));
        get().addXp(8);
      },
      updateGoal: (id, patch) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      toggleGoal: (id) => {
        const g = get().goals.find((x) => x.id === id);
        if (!g) return;
        const completed = !g.completed;
        set((s) => ({ goals: s.goals.map((x) => (x.id === id ? { ...x, completed } : x)) }));
        if (completed) {
          get().pushActivity({ type: "goal-completed", ref: id, label: `Completed goal "${g.title}"` });
          get().unlockAchievement("first-goal");
          get().addXp(40);
        }
      },
      logGoalHours: (id, hours) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id ? { ...g, loggedHours: Math.max(0, g.loggedHours + hours) } : g,
          ),
        })),

      addSession: (s) => {
        const session: FocusSession = { id: uid(), ...s };
        set((st) => ({ sessions: [session, ...st.sessions] }));
        if (s.mode === "focus") {
          get().pushActivity({ type: "focus-session", label: `Focused for ${Math.round(s.durationSec / 60)}m` });
          get().unlockAchievement("first-session");
          get().addXp(Math.round(s.durationSec / 60));
        }
      },

      addPlannerTask: (title, date = new Date().toISOString().slice(0, 10)) => {
        const todays = get().planner.filter((t) => t.date === date);
        const t: PlannerTask = { id: uid(), title, completed: false, date, order: todays.length };
        set((s) => ({ planner: [...s.planner, t] }));
      },
      togglePlannerTask: (id) =>
        set((s) => ({ planner: s.planner.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)) })),
      deletePlannerTask: (id) => set((s) => ({ planner: s.planner.filter((t) => t.id !== id) })),
      reorderPlanner: (date, orderedIds) =>
        set((s) => ({
          planner: s.planner.map((t) => {
            if (t.date !== date) return t;
            const idx = orderedIds.indexOf(t.id);
            return idx === -1 ? t : { ...t, order: idx };
          }),
        })),

      pushActivity: (a) =>
        set((s) => ({
          activity: [{ id: uid(), at: a.at ?? Date.now(), ...a }, ...s.activity].slice(0, 200),
        })),
      unlockAchievement: (id) =>
        set((s) => ({
          achievements: s.achievements.map((a) =>
            a.id === id && !a.unlockedAt ? { ...a, unlockedAt: Date.now() } : a,
          ),
        })),
      addXp: (n) => set((s) => ({ xp: s.xp + n })),

      exportAll: () => {
        const { topics, problems, goals, sessions, planner, achievements, activity, settings, xp } = get();
        return JSON.stringify(
          { v: 1, topics, problems, goals, sessions, planner, achievements, activity, settings, xp },
          null,
          2,
        );
      },
      importAll: (json) => {
        try {
          const d = JSON.parse(json);
          set((s) => ({
            topics: d.topics ?? s.topics,
            problems: d.problems ?? s.problems,
            goals: d.goals ?? s.goals,
            sessions: d.sessions ?? s.sessions,
            planner: d.planner ?? s.planner,
            achievements: d.achievements ?? s.achievements,
            activity: d.activity ?? s.activity,
            settings: { ...s.settings, ...(d.settings ?? {}) },
            xp: d.xp ?? s.xp,
          }));
          return true;
        } catch {
          return false;
        }
      },
      resetAll: () =>
        set({
          topics: [], problems: [], goals: [], sessions: [], planner: [],
          achievements: seedAchievements(), activity: [], xp: 0, activeTopicId: null,
        }),
    }),
    {
      name: "Milestone-learn:v1",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : (undefined as never))),
      partialize: (s) => ({
        settings: s.settings,
        topics: s.topics,
        problems: s.problems,
        goals: s.goals,
        sessions: s.sessions,
        planner: s.planner,
        achievements: s.achievements,
        activity: s.activity,
        xp: s.xp,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

/* selectors / helpers */
export function topicProgress(topicId: string, all: Topic[]): number {
  const children = all.filter((t) => t.parentId === topicId);
  if (children.length === 0) {
    const t = all.find((x) => x.id === topicId);
    return t?.status === "completed" ? 100 : t?.status === "in-progress" ? 50 : 0;
  }
  const sum = children.reduce((acc, c) => acc + topicProgress(c.id, all), 0);
  return Math.round(sum / children.length);
}

export function getStreak(activity: ActivityLog[]): number {
  if (activity.length === 0) return 0;
  const days = new Set(
    activity.map((a) => new Date(a.at).toISOString().slice(0, 10)),
  );
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const k = cursor.toISOString().slice(0, 10);
    if (days.has(k)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      // allow today to be empty (count from yesterday)
      if (streak === 0) {
        cursor.setDate(cursor.getDate() - 1);
        const k2 = cursor.toISOString().slice(0, 10);
        if (days.has(k2)) continue;
      }
      break;
    }
  }
  return streak;
}
