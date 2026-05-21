import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Check, Plus as PlusIcon, Minus } from "lucide-react";
import { useApp } from "@/store/app";
import { Modal } from "@/components/ui/Modal";
import { notify, celebrate } from "@/lib/feedback";
import { format, differenceInCalendarDays } from "date-fns";

export function GoalsView() {
  const goals = useApp((s) => s.goals);
  const addGoal = useApp((s) => s.addGoal);
  const toggle = useApp((s) => s.toggleGoal);
  const remove = useApp((s) => s.deleteGoal);
  const log = useApp((s) => s.logGoalHours);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", targetHours: 10, deadline: "", description: "" });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Goals</h2>
          <p className="text-sm text-muted-foreground">Set deliberate targets with deadlines.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 flex items-center gap-1.5"
        >
          <Plus className="size-4" /> New goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="surface border border-dashed border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
          No goals yet. Create your first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.loggedHours / Math.max(1, g.targetHours)) * 100));
            const days = g.deadline ? differenceInCalendarDays(new Date(g.deadline), new Date()) : null;
            return (
              <motion.div
                key={g.id}
                layout
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                className="surface rounded-2xl border border-border p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className={`font-medium ${g.completed ? "line-through text-muted-foreground" : ""}`}>{g.title}</div>
                    {g.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{g.description}</p>}
                  </div>
                  <button
                    onClick={() => remove(g.id)}
                    className="size-8 rounded-md hover:bg-accent grid place-items-center text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>{g.loggedHours}h / {g.targetHours}h</span>
                    <span className="tabular-nums">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div className="h-full bg-primary"
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 22 }} />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {g.deadline ? (
                      <>Due {format(new Date(g.deadline), "MMM d")} · {days! >= 0 ? `${days}d left` : `${Math.abs(days!)}d ago`}</>
                    ) : "No deadline"}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => log(g.id, -1)} className="size-7 rounded-md border border-border grid place-items-center hover:bg-accent text-muted-foreground"><Minus className="size-3.5" /></button>
                    <button onClick={() => log(g.id, 1)} className="size-7 rounded-md border border-border grid place-items-center hover:bg-accent text-muted-foreground"><PlusIcon className="size-3.5" /></button>
                    <button
                      onClick={() => { toggle(g.id); if (!g.completed) celebrate(); }}
                      className={`ml-1 h-7 px-2 rounded-md text-xs font-medium flex items-center gap-1 ${
                        g.completed ? "bg-success text-success-foreground" : "bg-foreground text-background hover:opacity-90"
                      }`}
                    >
                      <Check className="size-3.5" /> {g.completed ? "Done" : "Mark"}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New goal">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title.trim() || form.targetHours <= 0) return;
            addGoal({
              title: form.title.trim(),
              targetHours: form.targetHours,
              deadline: form.deadline || undefined,
              description: form.description || undefined,
            });
            notify.success("Goal created");
            setOpen(false);
            setForm({ title: "", targetHours: 10, deadline: "", description: "" });
          }}
          className="space-y-3"
        >
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1.5">Title</span>
            <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-muted border border-border outline-none focus:ring-2 focus:ring-ring text-sm" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-muted-foreground mb-1.5">Target hours</span>
              <input type="number" min={1} value={form.targetHours} onChange={(e) => setForm({ ...form, targetHours: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg bg-muted border border-border outline-none text-sm" />
            </label>
            <label className="block">
              <span className="block text-xs text-muted-foreground mb-1.5">Deadline</span>
              <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-muted border border-border outline-none text-sm" />
            </label>
          </div>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1.5">Description (optional)</span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full min-h-[80px] p-3 rounded-lg bg-muted border border-border outline-none text-sm resize-y" />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setOpen(false)} className="h-9 px-3 rounded-lg border border-border text-sm hover:bg-accent">Cancel</button>
            <button type="submit" className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
