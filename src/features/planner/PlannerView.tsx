import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, GripVertical, Check } from "lucide-react";
import { useApp } from "@/store/app";
import {
  DndContext, PointerSensor, useSensor, useSensors, closestCenter, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";

export function PlannerView() {
  const planner = useApp((s) => s.planner);
  const add = useApp((s) => s.addPlannerTask);
  const toggle = useApp((s) => s.togglePlannerTask);
  const remove = useApp((s) => s.deletePlannerTask);
  const reorder = useApp((s) => s.reorderPlanner);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");

  const list = useMemo(
    () => planner.filter((t) => t.date === date).sort((a, b) => a.order - b.order),
    [planner, date],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const onEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = list.map((t) => t.id);
    const next = arrayMove(ids, ids.indexOf(active.id as string), ids.indexOf(over.id as string));
    reorder(date, next);
  };

  const done = list.filter((t) => t.completed).length;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="surface rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold tracking-tight">Daily planner</h2>
            <p className="text-xs text-muted-foreground">{format(new Date(date), "EEEE, MMM d")}</p>
          </div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="h-9 px-3 rounded-lg bg-muted border border-border text-sm outline-none" />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; add(title.trim(), date); setTitle(""); }}
          className="flex gap-2"
        >
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task…"
            className="flex-1 h-10 px-3 rounded-lg bg-muted border border-border outline-none focus:ring-2 focus:ring-ring text-sm" />
          <button className="h-10 px-3 rounded-lg bg-lime-600 text-primary-foreground text-sm font-medium hover:opacity-90 flex items-center gap-1.5">
            <Plus className="size-4" /> Add
          </button>
        </form>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{done} of {list.length} done</span>
          <span className="tabular-nums">{list.length === 0 ? 0 : Math.round((done / list.length) * 100)}%</span>
        </div>
        <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-success"
            animate={{ width: `${list.length === 0 ? 0 : (done / list.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }} />
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
        <SortableContext items={list.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {list.length === 0 && (
                <motion.li key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="surface rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nothing planned. Add your first task.
                </motion.li>
              )}
              {list.map((t) => (
                <SortableRow key={t.id} task={t} onToggle={() => toggle(t.id)} onDelete={() => remove(t.id)} />
              ))}
            </AnimatePresence>
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableRow({ task, onToggle, onDelete }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  return (
    <motion.li
      ref={setNodeRef} style={style}
      layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
      className="surface rounded-xl border border-border flex items-center gap-2 pl-1 pr-2 py-2"
    >
      <button {...attributes} {...listeners}
        className="size-7 grid place-items-center text-muted-foreground cursor-grab active:cursor-grabbing">
        <GripVertical className="size-4" />
      </button>
      <button
        onClick={onToggle}
        className={`size-5 rounded-md border grid place-items-center ${
          task.completed ? "bg-success border-success text-success-foreground" : "border-border hover:border-foreground/40"
        }`}
      >
        {task.completed && <Check className="size-3" />}
      </button>
      <span className={`flex-1 text-sm truncate ${task.completed ? "line-through text-muted-foreground" : ""}`}>
        {task.title}
      </span>
      <button onClick={onDelete}
        className="size-8 rounded-md hover:bg-accent grid place-items-center text-muted-foreground hover:text-destructive">
        <Trash2 className="size-4" />
      </button>
    </motion.li>
  );
}
