import { motion, AnimatePresence } from "framer-motion";
import { Search, Hash, Code2, NotebookPen, Target, Timer, BarChart3, ListTodo, LayoutDashboard, Map } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useApp, type View } from "@/store/app";

const viewItems: { id: View; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Go to Dashboard", icon: LayoutDashboard },
  { id: "roadmap", label: "Go to Roadmap", icon: Map },
  { id: "problems", label: "Go to Problems", icon: Code2 },
  { id: "notes", label: "Go to Notes", icon: NotebookPen },
  { id: "goals", label: "Go to Goals", icon: Target },
  { id: "focus", label: "Go to Focus", icon: Timer },
  { id: "analytics", label: "Go to Analytics", icon: BarChart3 },
  { id: "planner", label: "Go to Planner", icon: ListTodo },
];

export function CommandPalette() {
  const open = useApp((s) => s.paletteOpen);
  const toggle = useApp((s) => s.togglePalette);
  const setView = useApp((s) => s.setView);
  const setActiveTopic = useApp((s) => s.setActiveTopic);
  const topics = useApp((s) => s.topics);
  const problems = useApp((s) => s.problems);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    const views = viewItems.filter((v) => !query || v.label.toLowerCase().includes(query));
    const t = topics.filter((t) => !query || t.title.toLowerCase().includes(query)).slice(0, 6);
    const p = problems.filter((p) => !query || p.title.toLowerCase().includes(query)).slice(0, 6);
    return { views, t, p };
  }, [q, topics, problems]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-start pt-[12vh] px-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => toggle(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-xl surface rounded-2xl border border-border shadow-elevated overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border">
              <Search className="size-4 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search topics, problems, or jump to a page…"
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <kbd className="text-[10px] font-mono border border-border rounded px-1.5 py-0.5">esc</kbd>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3">
              <Section title="Navigation">
                {results.views.map((v) => {
                  const Icon = v.icon;
                  return (
                    <Item key={v.id} onClick={() => { setView(v.id); toggle(false); }}>
                      <Icon className="size-4 text-muted-foreground" />
                      <span>{v.label}</span>
                    </Item>
                  );
                })}
              </Section>
              {results.t.length > 0 && (
                <Section title="Topics">
                  {results.t.map((t) => (
                    <Item key={t.id} onClick={() => { setActiveTopic(t.id); setView("notes"); toggle(false); }}>
                      <Hash className="size-4 text-muted-foreground" />
                      <span className="truncate">{t.title}</span>
                    </Item>
                  ))}
                </Section>
              )}
              {results.p.length > 0 && (
                <Section title="Problems">
                  {results.p.map((p) => (
                    <Item key={p.id} onClick={() => { setView("problems"); toggle(false); }}>
                      <Code2 className="size-4 text-muted-foreground" />
                      <span className="truncate">{p.title}</span>
                    </Item>
                  ))}
                </Section>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-2.5 pt-1.5 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
function Item({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full h-9 px-2.5 rounded-md flex items-center gap-2.5 text-sm text-foreground hover:bg-accent"
    >
      {children}
    </button>
  );
}
