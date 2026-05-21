import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Map, Code2, NotebookPen, Target,
  Timer, BarChart3, ListTodo, Settings, GraduationCap,
} from "lucide-react";
import { useApp, type View } from "@/store/app";

const items: { id: View; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "roadmap", label: "Roadmap", icon: Map },
  { id: "problems", label: "Problems", icon: Code2 },
  { id: "notes", label: "Notes", icon: NotebookPen },
  { id: "goals", label: "Goals", icon: Target },
  { id: "focus", label: "Focus", icon: Timer },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "planner", label: "Planner", icon: ListTodo },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);
  const xp = useApp((s) => s.xp);
  const level = Math.floor(xp / 100) + 1;
  const progress = xp % 100;

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border surface transition-[width] duration-300 ease-out",
        collapsed ? "w-[72px]" : "w-[248px]",
      )}
    >
      <div className="h-16 flex items-center gap-2.5 px-4 border-b border-border">
        <div className="size-9 rounded-md bg-lime-600 text-primary-foreground grid place-items-center shrink-0">
          <GraduationCap className="size-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="font-semibold tracking-tight">Milestone</span>
            <span className="text-[11px] text-muted-foreground">Learn deliberately</span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn(
                "relative w-full h-10 px-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-accent",
                active && "text-foreground bg-accent",
                collapsed && "justify-center px-0",
              )}
              title={collapsed ? item.label : undefined}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="size-[18px] relative z-10 shrink-0" />
              {!collapsed && <span className="relative z-10">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className={cn("p-3 border-t border-border", collapsed && "px-2")}>
        <div className="rounded-xl border border-border p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Level</span>
            {!collapsed && <span className="text-xs text-muted-foreground">{xp} XP</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xl font-semibold tabular-nums">{level}</div>
            {!collapsed && (
              <div className="flex-1">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
