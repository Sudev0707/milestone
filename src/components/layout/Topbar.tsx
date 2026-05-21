import { Menu, Search, Moon, Sun, Command as CmdIcon, Plus } from "lucide-react";
import { useApp } from "@/store/app";
import { cn } from "@/lib/utils";

export function Topbar({
  onToggleSidebar,
  onQuickAdd,
}: {
  onToggleSidebar: () => void;
  onQuickAdd: () => void;
}) {
  const theme = useApp((s) => s.settings.theme);
  const toggleTheme = useApp((s) => s.toggleTheme);
  const togglePalette = useApp((s) => s.togglePalette);
  const search = useApp((s) => s.search);
  const setSearch = useApp((s) => s.setSearch);
  const view = useApp((s) => s.view);

  const title =
    view === "dashboard" ? "Dashboard"
    : view === "roadmap" ? "Learning Roadmap"
    : view === "problems" ? "Practice Problems"
    : view === "notes" ? "Notes"
    : view === "goals" ? "Goals"
    : view === "focus" ? "Focus Timer"
    : view === "analytics" ? "Analytics"
    : view === "planner" ? "Daily Planner"
    : "Settings";

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border glass">
      <div className="h-full px-4 md:px-6 flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="size-9 rounded-lg hover:bg-accent grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="size-[18px]" />
        </button>

        <h1 className="text-sm md:text-base font-semibold tracking-tight">{title}</h1>

        <div className="flex-1" />

        <button
          onClick={() => togglePalette(true)}
          className={cn(
            "h-9 hidden sm:flex items-center gap-2 px-3 rounded-lg border border-border text-sm",
            "text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
            "min-w-[260px]",
          )}
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Search anything…</span>
          <kbd className="text-[10px] font-mono border border-border rounded px-1.5 py-0.5 flex items-center gap-0.5">
            <CmdIcon className="size-3" />K
          </kbd>
        </button>

        <button
          onClick={() => togglePalette(true)}
          className="sm:hidden size-9 rounded-lg hover:bg-accent grid place-items-center text-muted-foreground hover:text-foreground"
          aria-label="Search"
        >
          <Search className="size-[18px]" />
        </button>

        <button
          onClick={onQuickAdd}
          className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">New topic</span>
        </button>

        <button
          onClick={toggleTheme}
          className="size-9 rounded-lg hover:bg-accent grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        </button>

        {/* Hidden search input syncs with store for global search */}
        <input className="sr-only" value={search} onChange={(e) => setSearch(e.target.value)} aria-hidden />
      </div>
    </header>
  );
}
