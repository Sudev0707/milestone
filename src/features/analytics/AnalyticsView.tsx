import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
} from "recharts";
import { useApp } from "@/store/app";
import { format } from "date-fns";

export function AnalyticsView() {
  const sessions = useApp((s) => s.sessions);
  const topics = useApp((s) => s.topics);
  const activity = useApp((s) => s.activity);

  // 30-day hours
  const daily = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().slice(0, 10);
      const mins = sessions
        .filter((s) => s.mode === "focus" && new Date(s.startedAt).toISOString().slice(0, 10) === key)
        .reduce((a, b) => a + b.durationSec, 0) / 60;
      return { date: format(d, "MMM d"), key, hours: +(mins / 60).toFixed(2) };
    });
  }, [sessions]);

  // Completion trend (cumulative completed topics over time)
  const completionTrend = useMemo(() => {
    const events = activity
      .filter((a) => a.type === "topic-completed")
      .sort((a, b) => a.at - b.at);
    let n = 0;
    return Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - i));
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      n = events.filter((e) => e.at <= end.getTime()).length;
      return { date: format(d, "MMM d"), completed: n };
    });
  }, [activity]);

  // Heatmap (12 weeks × 7 days)
  const heatmap = useMemo(() => {
    const weeks: { date: string; count: number }[][] = [];
    const today = new Date();
    const start = new Date(today); start.setDate(today.getDate() - 12 * 7 + 1);
    const map = new Map<string, number>();
    activity.forEach((a) => {
      const k = new Date(a.at).toISOString().slice(0, 10);
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    for (let w = 0; w < 12; w++) {
      const row: { date: string; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const cur = new Date(start); cur.setDate(start.getDate() + w * 7 + d);
        const k = cur.toISOString().slice(0, 10);
        row.push({ date: k, count: map.get(k) ?? 0 });
      }
      weeks.push(row);
    }
    return weeks;
  }, [activity]);

  // Most studied topics (by focus sessions tagged)
  const top = useMemo(() => {
    const byId = new Map<string, number>();
    sessions.forEach((s) => {
      if (s.topicId && s.mode === "focus") byId.set(s.topicId, (byId.get(s.topicId) ?? 0) + s.durationSec);
    });
    return Array.from(byId.entries())
      .map(([id, secs]) => ({ name: topics.find((t) => t.id === id)?.title ?? "Unknown", hours: +(secs / 3600).toFixed(2) }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 6);
  }, [sessions, topics]);

  const consistency = useMemo(() => {
    const active = new Set(activity.map((a) => new Date(a.at).toISOString().slice(0, 10))).size;
    return Math.min(100, Math.round((active / 30) * 100));
  }, [activity]);

  const heatLevel = (count: number) => {
    if (count === 0) return "bg-muted";
    if (count < 2) return "bg-primary/25";
    if (count < 5) return "bg-primary/55";
    if (count < 10) return "bg-primary/80";
    return "bg-primary";
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 surface rounded-2xl border border-border p-5">
          <h3 className="font-semibold tracking-tight">Study hours · last 30 days</h3>
          <div className="h-64 mt-3 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily} margin={{ top: 6, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="hours" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="surface rounded-2xl border border-border p-5">
          <h3 className="font-semibold tracking-tight">Consistency</h3>
          <p className="text-xs text-muted-foreground">Active days in the last 30</p>
          <div className="mt-3 text-3xl font-semibold tabular-nums">{consistency}%</div>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary"
              initial={{ width: 0 }} animate={{ width: `${consistency}%` }} transition={{ type: "spring", stiffness: 120, damping: 22 }} />
          </div>
          <div className="mt-5 text-xs uppercase tracking-wider text-muted-foreground">Cumulative completed</div>
          <div className="h-24 mt-1 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={completionTrend} margin={{ top: 6, right: 6, bottom: 0, left: -24 }}>
                <Line type="monotone" dataKey="completed" stroke="var(--success)" strokeWidth={2} dot={false} />
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 surface rounded-2xl border border-border p-5">
          <h3 className="font-semibold tracking-tight">Activity heatmap</h3>
          <p className="text-xs text-muted-foreground">Last 12 weeks</p>
          <div className="mt-4 flex gap-1 overflow-x-auto no-scrollbar">
            {heatmap.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.count} activities`}
                    className={`size-3.5 rounded-[3px] ${heatLevel(day.count)}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            Less
            <div className="flex gap-1">
              <span className="size-3 rounded-[3px] bg-muted" />
              <span className="size-3 rounded-[3px] bg-primary/25" />
              <span className="size-3 rounded-[3px] bg-primary/55" />
              <span className="size-3 rounded-[3px] bg-primary/80" />
              <span className="size-3 rounded-[3px] bg-primary" />
            </div>
            More
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="surface rounded-2xl border border-border p-5">
          <h3 className="font-semibold tracking-tight">Most studied</h3>
          <p className="text-xs text-muted-foreground">By focus time</p>
          {top.length === 0 ? (
            <div className="text-xs text-muted-foreground mt-4">Tag focus sessions with a topic to see this.</div>
          ) : (
            <div className="h-56 mt-3 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top} layout="vertical" margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="hours" fill="var(--primary)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
