import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Trash2, RotateCcw, Check } from "lucide-react";
import { useApp } from "@/store/app";
import type { Difficulty, ProblemStatus } from "@/types";
import { DifficultyBadge, ProblemStatusBadge } from "@/components/ui/Badges";
import { Modal } from "@/components/ui/Modal";
import { notify } from "@/lib/feedback";

export function ProblemsView() {
  const problems = useApp((s) => s.problems);
  const topics = useApp((s) => s.topics);
  const addProblem = useApp((s) => s.addProblem);
  const toggleSolved = useApp((s) => s.toggleProblemSolved);
  const deleteProblem = useApp((s) => s.deleteProblem);
  const updateProblem = useApp((s) => s.updateProblem);

  const [q, setQ] = useState("");
  const [diff, setDiff] = useState<"all" | Difficulty>("all");
  const [stat, setStat] = useState<"all" | ProblemStatus>("all");
  const [sort, setSort] = useState<"newest" | "title" | "difficulty">("newest");
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState<{ title: string; difficulty: Difficulty; topicId: string; tags: string }>({
    title: "", difficulty: "medium", topicId: topics[0]?.id ?? "", tags: "",
  });

  const list = useMemo(() => {
    let r = problems.filter((p) => !q || p.title.toLowerCase().includes(q.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(q.toLowerCase())));
    if (diff !== "all") r = r.filter((p) => p.difficulty === diff);
    if (stat !== "all") r = r.filter((p) => p.status === stat);
    if (sort === "title") r = [...r].sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "difficulty") {
      const w = { easy: 0, medium: 1, hard: 2 };
      r = [...r].sort((a, b) => w[a.difficulty] - w[b.difficulty]);
    } else r = [...r].sort((a, b) => b.createdAt - a.createdAt);
    return r;
  }, [problems, q, diff, stat, sort]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search problems or tags…"
            className="w-full h-10 pl-9 pr-3 rounded-md bg-muted border border-border outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={diff} onChange={(v) => setDiff(v as never)}
            options={[["all","All difficulties"],["easy","Easy"],["medium","Medium"],["hard","Hard"]]} />
          <Select value={stat} onChange={(v) => setStat(v as never)}
            options={[["all","All status"],["todo","To do"],["solved","Solved"],["review","Review"]]} />
          <Select value={sort} onChange={(v) => setSort(v as never)}
            options={[["newest","Newest"],["title","Title"],["difficulty","Difficulty"]]} />
        </div>
        <button
          onClick={() => { setOpen(true); setForm((f) => ({ ...f, topicId: topics[0]?.id ?? "" })); }}
          disabled={topics.length === 0}
          className="h-10 px-3 rounded-md bg-lime-600 text-primary-foreground text-sm font-medium hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50"
        >
          <Plus className="size-4" /> Add problem
        </button>
      </div>

      {topics.length === 0 && (
        <div className="text-sm text-muted-foreground border border-dashed border-border rounded-xl p-6 text-center">
          Add a topic first, then attach problems to it.
        </div>
      )}

      <AnimatePresence initial={false}>
        {list.length === 0 ? (
          <motion.div
            key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="surface border border-dashed border-border rounded-2xl p-10 text-center text-sm text-muted-foreground"
          >
            No problems match your filters.
          </motion.div>
        ) : (
          <motion.ul className="space-y-2">
            {list.map((p) => {
              const topic = topics.find((t) => t.id === p.topicId);
              return (
                <motion.li
                  layout key={p.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="surface rounded-xl border border-border p-3.5 flex items-center gap-3"
                >
                  <button
                    onClick={() => toggleSolved(p.id)}
                    className={`size-6 rounded-md border grid place-items-center transition ${
                      p.status === "solved" ? "bg-success border-success text-success-foreground" : "border-border hover:border-foreground/40"
                    }`}
                    aria-label="Toggle solved"
                  >
                    {p.status === "solved" && <Check className="size-3.5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-medium truncate ${p.status === "solved" ? "line-through text-muted-foreground" : ""}`}>
                      {p.title}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <DifficultyBadge d={p.difficulty} />
                      <ProblemStatusBadge s={p.status} />
                      {topic && <span className="text-[11px] text-muted-foreground">· {topic.title}</span>}
                      {p.tags.map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">#{t}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => updateProblem(p.id, { retries: p.retries + 1 })}
                    className="hidden sm:flex h-8 px-2 rounded-md text-xs items-center gap-1 hover:bg-accent text-muted-foreground"
                    title="Mark as retried"
                  >
                    <RotateCcw className="size-3.5" /> {p.retries}
                  </button>
                  <button
                    onClick={() => deleteProblem(p.id)}
                    className="size-8 rounded-md hover:bg-accent grid place-items-center text-muted-foreground hover:text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      <Modal open={open} onClose={() => setOpen(false)} title="Add problem">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title.trim() || !form.topicId) return;
            addProblem({
              title: form.title.trim(),
              topicId: form.topicId,
              difficulty: form.difficulty,
              tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
            });
            notify.success("Problem added");
            setOpen(false);
            setForm({ title: "", difficulty: "medium", topicId: form.topicId, tags: "" });
          }}
          className="space-y-3"
        >
          <Field label="Title">
            <input
              autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full h-10 px-3 rounded-md bg-muted border border-border outline-none focus:ring-2 focus:ring-ring text-sm"
              placeholder="Two Sum"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Topic">
              <select
                value={form.topicId} onChange={(e) => setForm({ ...form, topicId: e.target.value })}
                className="w-full h-10 px-3 rounded-md bg-muted border border-border outline-none text-sm"
              >
                {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </Field>
            <Field label="Difficulty">
              <select
                value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })}
                className="w-full h-10 px-3 rounded-md bg-muted border border-border outline-none text-sm"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </Field>
          </div>
          <Field label="Tags (comma-separated)">
            <input
              value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="arrays, hashmap"
              className="w-full h-10 px-3 rounded-md bg-muted border border-border outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setOpen(false)} className="h-9 px-3 rounded-md border border-border text-sm hover:bg-accent">Cancel</button>
            <button type="submit" className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">Add</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Select<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <select
      value={value} onChange={(e) => onChange(e.target.value as T)}
      className="h-10 px-2.5 rounded-md bg-muted border border-border outline-none text-sm"
    >
      {options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
    </select>
  );
}
