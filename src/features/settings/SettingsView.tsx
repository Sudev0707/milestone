import { useRef } from "react";
import { useApp } from "@/store/app";
import { notify } from "@/lib/feedback";
import { Moon, Sun, Download, Upload, Trash2 } from "lucide-react";

export function SettingsView() {
  const theme = useApp((s) => s.settings.theme);
  const setTheme = useApp((s) => s.setTheme);
  const exportAll = useApp((s) => s.exportAll);
  const importAll = useApp((s) => s.importAll);
  const resetAll = useApp((s) => s.resetAll);
  const fileRef = useRef<HTMLInputElement>(null);

  const onExport = () => {
    const json = exportAll();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lumen-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify.success("Backup downloaded");
  };

  const onImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importAll(String(reader.result));
      if (ok) notify.success("Backup restored");
      else notify.error("Invalid backup file");
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl space-y-4">
      <Section title="Appearance">
        <div className="flex gap-2">
          <ThemeBtn label="Light" active={theme === "light"} onClick={() => setTheme("light")} icon={<Sun className="size-4" />} />
          <ThemeBtn label="Dark" active={theme === "dark"} onClick={() => setTheme("dark")} icon={<Moon className="size-4" />} />
        </div>
      </Section>

      <Section title="Backup & restore" description="Your data is stored locally in this browser. Export regularly.">
        <div className="flex flex-wrap gap-2">
          <button onClick={onExport} className="h-9 px-3 rounded-lg border border-border text-sm hover:bg-accent flex items-center gap-1.5">
            <Download className="size-4" /> Export JSON
          </button>
          <button onClick={() => fileRef.current?.click()} className="h-9 px-3 rounded-lg border border-border text-sm hover:bg-accent flex items-center gap-1.5">
            <Upload className="size-4" /> Import JSON
          </button>
          <input
            ref={fileRef} type="file" accept="application/json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ""; }}
          />
        </div>
      </Section>

      <Section title="Danger zone" description="Permanently delete all topics, problems, goals, sessions, and notes from this browser.">
        <button
          onClick={() => { if (confirm("Delete everything? This cannot be undone.")) { resetAll(); notify.success("All data cleared"); } }}
          className="h-9 px-3 rounded-lg border border-destructive/40 text-destructive text-sm hover:bg-destructive/10 flex items-center gap-1.5"
        >
          <Trash2 className="size-4" /> Reset all data
        </button>
      </Section>

      <Section title="Keyboard shortcuts">
        <ul className="grid grid-cols-2 gap-2 text-sm">
          <Kbd label="Open command palette" k="⌘ / Ctrl + K" />
          <Kbd label="Toggle theme" k="⌘ / Ctrl + J" />
          <Kbd label="Quick add topic" k="N" />
          <Kbd label="Close modal" k="Esc" />
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="surface rounded-2xl border border-border p-5">
      <h3 className="font-semibold tracking-tight">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ThemeBtn({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`h-9 px-3 rounded-lg text-sm flex items-center gap-2 border transition ${
        active ? "bg-foreground text-background border-foreground" : "border-border hover:bg-accent"
      }`}>
      {icon} {label}
    </button>
  );
}

function Kbd({ label, k }: { label: string; k: string }) {
  return (
    <li className="flex items-center justify-between surface-elevated border border-border rounded-lg px-3 h-10">
      <span className="text-muted-foreground">{label}</span>
      <kbd className="text-[11px] font-mono border border-border rounded px-1.5 py-0.5">{k}</kbd>
    </li>
  );
}
