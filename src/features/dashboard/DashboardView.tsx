import { motion } from "framer-motion";
import { useApp, topicProgress, getStreak } from "@/store/app";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Flame, Clock, BookOpen, CheckCircle2, ArrowRight, Trophy } from "lucide-react";
import { format } from "date-fns";

export function DashboardView() {
  const topics = useApp((s) => s.topics);
  const sessions = useApp((s) => s.sessions);
  const goals = useApp((s) => s.goals);
  const activity = useApp((s) => s.activity);
  const setView = useApp((s) => s.setView);
  const achievements = useApp((s) => s.achievements);

  const completed = topics.filter((t) => t.status === "completed").length;
  const streak = getStreak(activity);

  const todayKey = new Date().toISOString().slice(0, 10);
  const focusToday = sessions
    .filter((s) => s.mode === "focus" && new Date(s.startedAt).toISOString().slice(0, 10) === todayKey)
    .reduce((a, b) => a + b.durationSec, 0);

  // Weekly data
  const weekly = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const mins = sessions
      .filter((s) => new Date(s.startedAt).toISOString().slice(0, 10) === key && s.mode === "focus")
      .reduce((a, b) => a + b.durationSec, 0) / 60;
    return { day: format(d, "EEE"), mins: Math.round(mins) };
  });
  const weekMax = Math.max(60, ...weekly.map((w) => w.mins));

  const overallProgress = topics.length
    ? Math.round(topics.filter((t) => t.parentId === null).reduce((a, t) => a + topicProgress(t.id, topics), 0)
      / Math.max(1, topics.filter((t) => t.parentId === null).length))
    : 0;

  const upcoming = goals.filter((g) => !g.completed).slice(0, 3);
  const recent = activity.slice(0, 6);
  const unlocked = achievements.filter((a) => a.unlockedAt).slice(0, 4);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="surface rounded-2xl border border-border p-6 md:p-8"
      >
        <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMM d")}</p>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
          Welcome back. Let's make today count.
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setView("focus")}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition flex items-center gap-1.5"
          >
            Start a focus session <ArrowRight className="size-4" />
          </button>
          <button
            onClick={() => setView("roadmap")}
            className="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-accent transition"
          >
            Open roadmap
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Topics" value={topics.length} hint={`${topics.filter(t => t.parentId === null).length} top-level`} />
        <StatCard icon={CheckCircle2} label="Completed" value={completed} hint={`${overallProgress}% overall`} />
        <StatCard icon={Flame} label="Streak" value={`${streak}d`} hint={streak > 0 ? "Keep going!" : "Start today"} />
        <StatCard icon={Clock} label="Focus today" value={`${Math.round(focusToday / 60)}m`} hint={`${sessions.length} sessions total`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="lg:col-span-2 surface rounded-2xl border border-border p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold tracking-tight">Weekly focus</h3>
              <p className="text-xs text-muted-foreground">Minutes per day, last 7 days</p>
            </div>
          </div>
          <div className="flex items-end gap-3 h-44">
            {weekly.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full h-full flex items-end">
                  <motion.div
                    className="w-full rounded-md bg-primary/85 group-hover:bg-primary transition-colors"
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.mins / weekMax) * 100}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="surface rounded-2xl border border-border p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold tracking-tight">Overall progress</h3>
            <ProgressRing value={overallProgress} size={56} />
          </div>
          <ul className="space-y-2 text-sm">
            <Row label="In progress" value={topics.filter((t) => t.status === "in-progress").length} />
            <Row label="Completed" value={completed} />
            <Row label="Revision needed" value={topics.filter((t) => t.status === "revision").length} />
            <Row label="Not started" value={topics.filter((t) => t.status === "not-started").length} />
          </ul>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="surface rounded-2xl border border-border p-5"
        >
          <h3 className="font-semibold tracking-tight">Upcoming goals</h3>
          <p className="text-xs text-muted-foreground mb-3">Stay accountable</p>
          {upcoming.length === 0 ? (
            <EmptyMini label="No goals yet" />
          ) : (
            <ul className="space-y-3">
              {upcoming.map((g) => {
                const pct = Math.min(100, Math.round((g.loggedHours / Math.max(1, g.targetHours)) * 100));
                return (
                  <li key={g.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">{g.title}</span>
                      <span className="text-muted-foreground tabular-nums">{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div className="h-full bg-primary"
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 20 }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 surface rounded-2xl border border-border p-5"
        >
          <h3 className="font-semibold tracking-tight">Recent activity</h3>
          <p className="text-xs text-muted-foreground mb-3">Latest actions across your tracker</p>
          {recent.length === 0 ? (
            <EmptyMini label="No activity yet" />
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((a) => (
                <li key={a.id} className="py-2.5 flex items-center justify-between text-sm">
                  <span className="truncate">{a.label}</span>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0 ml-3">
                    {format(a.at, "MMM d, HH:mm")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>

      {unlocked.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="surface rounded-2xl border border-border p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="size-4 text-warning" />
            <h3 className="font-semibold tracking-tight">Achievements</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {unlocked.map((a) => (
              <span key={a.id} className="px-3 py-1.5 rounded-full bg-accent text-sm">{a.title}</span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, hint,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode; hint?: string }) {
  return (
    <motion.div
      whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="surface rounded-2xl border border-border p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </li>
  );
}

function EmptyMini({ label }: { label: string }) {
  return (
    <div className="h-24 rounded-lg border border-dashed border-border grid place-items-center text-xs text-muted-foreground">
      {label}
    </div>
  );
}
