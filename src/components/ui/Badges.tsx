import { cn } from "@/lib/utils";
import type { TopicStatus, Difficulty, ProblemStatus } from "@/types";

export function StatusBadge({ status }: { status: TopicStatus }) {
  const map: Record<TopicStatus, { label: string; cls: string; dot: string }> = {
    "not-started": { label: "Not started", cls: "bg-muted text-muted-foreground", dot: "bg-muted-foreground/50" },
    "in-progress": { label: "In progress", cls: "bg-info/15 text-info", dot: "bg-info" },
    "completed":   { label: "Completed",   cls: "bg-success/15 text-success", dot: "bg-success" },
    "revision":    { label: "Revision",    cls: "bg-warning/15 text-warning", dot: "bg-warning" },
  };
  const it = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium", it.cls)}>
      <span className={cn("size-1.5 rounded-full", it.dot)} />
      {it.label}
    </span>
  );
}

export function DifficultyBadge({ d }: { d: Difficulty }) {
  const map: Record<Difficulty, string> = {
    easy: "bg-success/15 text-success",
    medium: "bg-warning/15 text-warning",
    hard: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-md capitalize", map[d])}>
      {d}
    </span>
  );
}

export function ProblemStatusBadge({ s }: { s: ProblemStatus }) {
  const map: Record<ProblemStatus, string> = {
    todo: "bg-muted text-muted-foreground",
    solved: "bg-success/15 text-success",
    review: "bg-info/15 text-info",
  };
  return (
    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-md capitalize", map[s])}>
      {s}
    </span>
  );
}
