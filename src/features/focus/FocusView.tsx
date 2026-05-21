import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { useApp } from "@/store/app";
import { celebrate, notify } from "@/lib/feedback";

type Mode = "focus" | "short-break" | "long-break";

export function FocusView() {
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const addSession = useApp((s) => s.addSession);
  const sessions = useApp((s) => s.sessions);
  const topics = useApp((s) => s.topics);

  const [mode, setMode] = useState<Mode>("focus");
  const [topicId, setTopicId] = useState<string>("");
  const [remaining, setRemaining] = useState<number>(settings.focusDuration * 60);
  const [running, setRunning] = useState(false);
  const startedRef = useRef<number | null>(null);
  const cycleRef = useRef(0);

  useEffect(() => {
    const dur =
      mode === "focus" ? settings.focusDuration :
      mode === "short-break" ? settings.shortBreak : settings.longBreak;
    setRemaining(dur * 60);
    setRunning(false);
    startedRef.current = null;
  }, [mode, settings.focusDuration, settings.shortBreak, settings.longBreak]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          finish();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, [running]);

  const totalDur =
    mode === "focus" ? settings.focusDuration * 60 :
    mode === "short-break" ? settings.shortBreak * 60 : settings.longBreak * 60;
  const pct = ((totalDur - remaining) / totalDur) * 100;

  const start = () => {
    if (!startedRef.current) startedRef.current = Date.now();
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setRemaining(totalDur);
    startedRef.current = null;
  };
  const finish = () => {
    setRunning(false);
    const ended = Date.now();
    const started = startedRef.current ?? ended - totalDur * 1000;
    addSession({
      startedAt: started,
      endedAt: ended,
      durationSec: totalDur - remaining || totalDur,
      mode,
      topicId: topicId || undefined,
    });
    startedRef.current = null;
    if (mode === "focus") {
      celebrate();
      notify.success("Focus session complete");
      cycleRef.current += 1;
      const next: Mode = cycleRef.current % settings.longBreakEvery === 0 ? "long-break" : "short-break";
      setMode(next);
    } else {
      notify("Break finished. Ready for the next sprint?");
      setMode("focus");
    }
  };
  const skip = () => finish();

  const todayKey = new Date().toISOString().slice(0, 10);
  const today = sessions.filter((s) => new Date(s.startedAt).toISOString().slice(0, 10) === todayKey);
  const todayMins = Math.round(today.filter(s => s.mode === "focus").reduce((a, b) => a + b.durationSec, 0) / 60);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 surface rounded-2xl border border-border p-6 md:p-10">
        <div className="flex items-center gap-1.5 mb-6">
          {(["focus","short-break","long-break"] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`h-8 px-3 rounded-md text-xs font-medium capitalize transition ${
                mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent"
              }`}>
              {m.replace("-", " ")}
            </button>
          ))}
        </div>

        <div className="grid place-items-center py-6">
          <div className="relative">
            <svg width={280} height={280} className="-rotate-90">
              <circle cx={140} cy={140} r={130} stroke="var(--muted)" strokeWidth={10} fill="none" />
              <motion.circle
                cx={140} cy={140} r={130}
                stroke="var(--primary)" strokeWidth={10} fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 130}
                animate={{ strokeDashoffset: 2 * Math.PI * 130 * (1 - pct / 100) }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-5xl md:text-6xl font-semibold tabular-nums tracking-tight">{fmt(remaining)}</div>
                <div className="text-xs text-muted-foreground mt-2 capitalize">{mode.replace("-", " ")}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-2">
          <button onClick={reset} className="h-10 px-4 rounded-lg border border-border hover:bg-accent text-sm flex items-center gap-1.5">
            <RotateCcw className="size-4" /> Reset
          </button>
          {!running ? (
            <button onClick={start} className="h-10 px-6 rounded-lg bg-lime-600 text-primary-foreground text-sm font-medium hover:opacity-90 flex items-center gap-1.5">
              <Play className="size-4" /> Start
            </button>
          ) : (
            <button onClick={pause} className="h-10 px-6 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 flex items-center gap-1.5">
              <Pause className="size-4" /> Pause
            </button>
          )}
          <button onClick={skip} className="h-10 px-4 rounded-lg border border-border hover:bg-accent text-sm flex items-center gap-1.5">
            <SkipForward className="size-4" /> Skip
          </button>
        </div>

        {topics.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Tagging:</span>
            <select value={topicId} onChange={(e) => setTopicId(e.target.value)}
              className="h-8 px-2 rounded-md bg-muted border border-border text-xs">
              <option value="">No topic</option>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="surface rounded-2xl border border-border p-5">
          <div className="text-xs text-muted-foreground">Today</div>
          <div className="text-3xl font-semibold tabular-nums tracking-tight mt-1">{todayMins}m</div>
          <div className="text-xs text-muted-foreground">
            {today.filter(s => s.mode === "focus").length} focus session{today.filter(s => s.mode === "focus").length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="surface rounded-2xl border border-border p-5 space-y-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Durations (min)</div>
          {([["focusDuration","Focus"],["shortBreak","Short break"],["longBreak","Long break"]] as const).map(([k, label]) => (
            <label key={k} className="block">
              <div className="flex items-center justify-between text-sm">
                <span>{label}</span>
                <span className="tabular-nums text-muted-foreground">{settings[k]}m</span>
              </div>
              <input type="range" min={5} max={k === "longBreak" ? 60 : k === "shortBreak" ? 30 : 90}
                value={settings[k]}
                onChange={(e) => updateSettings({ [k]: Number(e.target.value) } as never)}
                className="w-full accent-[var(--primary)]" />
            </label>
          ))}
        </div>

        <div className="surface rounded-2xl border border-border p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Recent sessions</div>
          {sessions.length === 0 ? (
            <div className="text-xs text-muted-foreground">No sessions yet.</div>
          ) : (
            <ul className="space-y-2">
              {sessions.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{s.mode.replace("-", " ")}</span>
                  <span className="text-muted-foreground tabular-nums text-xs">{Math.round(s.durationSec / 60)}m</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
