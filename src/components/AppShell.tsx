import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import { useApp } from "@/store/app";
import { useTheme } from "@/hooks/use-theme";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { CommandPalette } from "@/components/CommandPalette";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { RoadmapView } from "@/features/roadmap/RoadmapView";
import { ProblemsView } from "@/features/problems/ProblemsView";
import { NotesView } from "@/features/notes/NotesView";
import { GoalsView } from "@/features/goals/GoalsView";
import { FocusView } from "@/features/focus/FocusView";
import { AnalyticsView } from "@/features/analytics/AnalyticsView";
import { PlannerView } from "@/features/planner/PlannerView";
import { SettingsView } from "@/features/settings/SettingsView";
import { Modal } from "@/components/ui/Modal";
import { notify } from "@/lib/feedback";
import {
  LayoutDashboard, Map, Code2, Timer, ListTodo,
} from "lucide-react";

export function AppShell() {
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);
  const togglePalette = useApp((s) => s.togglePalette);
  const toggleTheme = useApp((s) => s.toggleTheme);
  const addTopic = useApp((s) => s.addTopic);
  const theme = useTheme();

  const [collapsed, setCollapsed] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickDescription, setQuickDescription] = useState("");
  const [quickTags, setQuickTags] = useState("");
  const [quickUrl, setQuickUrl] = useState("");

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const isTyping =
        e.target instanceof HTMLElement &&
        (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable);

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault(); togglePalette(true);
      } else if (mod && e.key.toLowerCase() === "j") {
        e.preventDefault(); toggleTheme();
      } else if (!isTyping && !mod && e.key.toLowerCase() === "n") {
        e.preventDefault(); setQuickOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePalette, toggleTheme]);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar collapsed={collapsed} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          onToggleSidebar={() => setCollapsed((c) => !c)}
          onQuickAdd={() => setQuickOpen(true)}
        />

        <main className="flex-1 px-4 md:px-6 py-5 md:py-7 pb-24 md:pb-7 max-w-[1400px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {view === "dashboard" && <DashboardView />}
              {view === "roadmap" && <RoadmapView />}
              {view === "problems" && <ProblemsView />}
              {view === "notes" && <NotesView />}
              {view === "goals" && <GoalsView />}
              {view === "focus" && <FocusView />}
              {view === "analytics" && <AnalyticsView />}
              {view === "planner" && <PlannerView />}
              {view === "settings" && <SettingsView />}
            </motion.div>
          </AnimatePresence>
        </main>

        <MobileTabs />
      </div>

      <CommandPalette />

      <Modal open={quickOpen} onClose={() => setQuickOpen(false)} title="New topic">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!quickTitle.trim()) return;
            const tags = quickTags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);

            addTopic({
              title: quickTitle.trim(),
              description: quickDescription.trim() || undefined,
              tags: tags.length ? tags : undefined,
              url: quickUrl.trim() || undefined,
            });
            notify.success("Topic added");
            setQuickTitle("");
            setQuickDescription("");
            setQuickTags("");
            setQuickUrl("");
            setQuickOpen(false);
            setView("roadmap");
          }}
          className="space-y-3"
        >
           <div className="space-y-3">
            <div>
              <label
                className="block font-bold text-xs text-muted-foreground mb-1.5"
                htmlFor="topic-title"
                title="Title"
              >
                Title
              </label>
              <input
                id="topic-title"
                autoFocus
                placeholder="e.g. Data Structures"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-muted border border-border outline-none focus:ring-1 focus:ring-green-700 text-sm"
              />
            </div>

            <div>
              <label
                className="block font-bold text-xs text-muted-foreground mb-1.5"
                htmlFor="topic-description"
                title="Description (optional)"
              >
                Description (optional)
              </label>
              <textarea
                id="topic-description"
                placeholder="short summary"
                title="Description"
                value={quickDescription}
                onChange={(e) => setQuickDescription(e.target.value)}
                className="w-full min-h-[50px] p-3 rounded-md bg-muted border border-border outline-none text-sm resize-y focus:ring-1 focus:ring-green-700"
              />
            </div>

            <div>
              <label
                className="block font-bold text-xs text-muted-foreground mb-1.5"
                htmlFor="topic-tags"
              >
                Tags (comma-separated)
              </label>
              <input
                id="topic-tags"
                placeholder="e.g. arrays, hashmap"
                title="Tags"
                value={quickTags}
                onChange={(e) => setQuickTags(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-muted border border-border outline-none focus:ring-1 focus:ring-green-700 text-sm"
              />
            </div>

            <div>
              <label
                className="block font-bold text-xs text-muted-foreground mb-1.5"
                htmlFor="topic-url"
                title="URL (optional)"
              >
                URL (optional comma-separated)
              </label>
              <input
                id="topic-url"
                placeholder="https://..., https://..."
                title="URL"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-muted border border-border outline-none focus:ring-1 focus:ring-green-700 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setQuickOpen(false);
                setQuickTitle("");
                setQuickDescription("");
                setQuickTags("");
                setQuickUrl("");
              }}
              className="h-9 px-3 rounded-md border border-border text-sm hover:bg-accent"
            >
              Cancel
            </button>
            <button type="submit" className="h-9 px-3 rounded-md bg-lime-600 text-primary-foreground text-sm font-medium hover:opacity-90">Create</button>
          </div>
        </form>
      </Modal>

      <Toaster
        theme={theme}
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            border: "1px solid var(--border)",
          },
        }}
      />
    </div>
  );
}

function MobileTabs() {
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);
  const items = [
    { id: "dashboard" as const, icon: LayoutDashboard, label: "Home" },
    { id: "roadmap" as const, icon: Map, label: "Roadmap" },
    { id: "focus" as const, icon: Timer, label: "Focus" },
    { id: "problems" as const, icon: Code2, label: "Problems" },
    { id: "planner" as const, icon: ListTodo, label: "Plan" },
  ];
  return (
    <nav className="md:hidden fixed bottom-3 inset-x-3 z-30 glass rounded-2xl border border-border shadow-elevated px-1.5 py-1.5">
      <div className="grid grid-cols-5">
        {items.map((it) => {
          const active = view === it.id;
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              onClick={() => setView(it.id)}
              className={`relative h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="mobile-tab"
                  className="absolute inset-0 rounded-xl bg-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="size-[18px] relative z-10" />
              <span className="relative z-10">{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
