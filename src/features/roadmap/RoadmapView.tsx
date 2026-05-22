import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Plus,
  MoreHorizontal,
  Trash2,
  Pencil,
  FileText,
  Code2,
  Clock,
  GripVertical,
  GitBranch,
  Eye,
} from "lucide-react";
import { useApp, topicProgress } from "@/store/app";
import type { Topic, TopicStatus } from "@/types";
import { StatusBadge } from "@/components/ui/Badges";
import { Modal } from "@/components/ui/Modal";
import { celebrate, notify } from "@/lib/feedback";
import { ProgressRing } from "@/components/ui/ProgressRing";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";

export function RoadmapView() {
  const topics = useApp((s) => s.topics);
  const problems = useApp((s) => s.problems);
  const addTopic = useApp((s) => s.addTopic);
  const reorder = useApp((s) => s.reorderTopics);
  const search = useApp((s) => s.search);

  const [modal, setModal] = useState<{ parentId: string | null } | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [url, setUrl] = useState("");




  const roots = useMemo(
    () =>
      topics
        .filter((t) => t.parentId === null)
        .filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.order - b.order),
    [topics, search],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = roots.map((t) => t.id);
    const newIds = arrayMove(ids, ids.indexOf(active.id as string), ids.indexOf(over.id as string));
    reorder(null, newIds);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Your roadmap</h2>
          <p className="text-sm text-muted-foreground">
            Organize what you're learning. Drag to reorder.
          </p>
        </div>
        <button
          onClick={() => {
            setModal({ parentId: null });
            setTitle("");
            setDescription("");
            setTags("");
            setUrl("");
          }}

          aria-label="Add topic"
          className="h-9 px-3 rounded-md bg-lime-600 text-primary-foreground text-sm font-medium hover:opacity-90 flex items-center gap-1.5"
        >
          <Plus className="size-4" /> Add topic
        </button>
      </div>

      {roots.length === 0 ? (
        <EmptyState
          onAdd={() => {
            setModal({ parentId: null });
            setTitle("");
          }}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={roots.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2.5">
              {roots.map((t) => (
                <TopicNode
                  key={t.id}
                  topic={t}
                  level={0}
                  onAddChild={(parentId) => {
                    setModal({ parentId });
                    setTitle("");
                  }}
                  problems={problems}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.parentId ? "Add subtopic" : "Add topic"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;

            const parsedUrls = url
              .split(",")
              .map((u) => u.trim())
              .filter(Boolean);

            addTopic({
              title: title.trim(),
              parentId: modal?.parentId ?? null,
              description: description.trim() || undefined,
              // Store as a normalized comma-separated string (no spaces) to avoid href like "..., %20..."
              url: parsedUrls.length ? parsedUrls.join(",") : undefined,
            });

            notify.success("Topic added");
            setModal(null);
            setTitle("");
            setDescription("");
            setTags("");
            setUrl("");

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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                value={tags}
                onChange={(e) => setTags(e.target.value)}
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
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-muted border border-border outline-none focus:ring-1 focus:ring-green-700 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setModal(null);
                setTitle("");
                setDescription("");
                setTags("");
              }}
              className="h-9 px-3 rounded-md border border-border text-sm hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-3 rounded-md bg-lime-600 text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function TopicNode({
  topic,
  level,
  onAddChild,
  problems,
}: {
  topic: Topic;
  level: number;
  onAddChild: (parentId: string) => void;
  problems: ReturnType<typeof useApp.getState>["problems"];
}) {
  const topics = useApp((s) => s.topics);
  const setStatus = useApp((s) => s.setTopicStatus);
  const updateTopic = useApp((s) => s.updateTopic);
  const deleteTopic = useApp((s) => s.deleteTopic);
  const setActive = useApp((s) => s.setActiveTopic);
  const setView = useApp((s) => s.setView);
  const reorder = useApp((s) => s.reorderTopics);

  const children = topics.filter((t) => t.parentId === topic.id).sort((a, b) => a.order - b.order);

  const [open, setOpen] = useState(level < 1);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(topic.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const extractedTags = useMemo(() => {
    const matches = topic.notes?.match(/(^|\s)#([\w-]+)/g) ?? [];
    const unique = new Set(matches.map((m) => m.trim().replace(/^#/, "")).filter(Boolean));
    return Array.from(unique);
  }, [topic.notes]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: topic.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const pct = topicProgress(topic.id, topics);
  const probCount = problems.filter((p) => p.topicId === topic.id).length;
  const noteCount = topic.notes && topic.notes.trim().length > 0 ? 1 : 0;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  return (
    <li ref={setNodeRef} style={style}>
      <motion.div layout className="surface rounded-xl border border-border shadow-soft">
        <div className="flex items-stretch">
          <button
            {...attributes}
            {...listeners}
            className="px-1.5 grid place-items-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
            aria-label="Drag"
          >
            <GripVertical className="size-4" />
          </button>

          <button
            onClick={() => setOpen((o) => !o)}
            className="size-9 grid place-items-center text-muted-foreground hover:text-foreground"
            aria-label="Toggle"
          >
            <motion.span
              animate={{ rotate: open ? 90 : 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 26 }}
            >
              <ChevronRight className="size-4" />
            </motion.span>
          </button>

          <div className="flex-1 min-w-0 py-3 pr-3 flex items-center gap-3">
            <ProgressRing
              value={pct}
              size={36}
              stroke={4}
              label={<span className="text-[10px]">{pct}%</span>}
            />
            <div className="min-w-0 flex-1">
              {editing ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => {
                    updateTopic(topic.id, { title: draft.trim() || topic.title });
                    setEditing(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      (e.target as HTMLInputElement).blur();
                    }
                    if (e.key === "Escape") {
                      setDraft(topic.title);
                      setEditing(false);
                    }
                  }}
                  className="h-7 w-full bg-muted px-2 rounded-md border border-border outline-none text-sm"
                />
              ) : (
                <button
                  className="text-left font-medium text-sm truncate hover:underline underline-offset-4 decoration-border"
                  onClick={() => {
                    setActive(topic.id);
                    setView("notes");
                  }}
                >
                  {topic.title}
                </button>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <StatusBadge status={topic.status} />
                <span className="inline-flex items-center gap-1">
                  <FileText className="size-3" />
                  {noteCount} note{noteCount === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Code2 className="size-3" />
                  {probCount} problem{probCount === 1 ? "" : "s"}
                </span>
                {topic.lastStudiedAt && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" />
                    {format(topic.lastStudiedAt, "MMM d, HH:mm")}
                  </span>
                )}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1 text-[12px] text-muted-foreground leading-none mr-1 select-none">
              <GitBranch className="size-3" />
              <span>{children.length}</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setDetailsOpen(true);
              }}
              className="size-8 rounded-md hover:bg-accent grid place-items-center text-muted-foreground hover:text-foreground "
              aria-label="View topic details"
            >
              <Eye className="size-4" />
            </button>

            <select
              aria-label="Update topic status"
              value={topic.status}
              onChange={(e) => {
                const v = e.target.value as TopicStatus;
                setStatus(topic.id, v);
                if (v === "completed") celebrate();
              }}
              className="hidden md:block h-8 text-xs bg-muted border border-border rounded-md px-2 outline-none"
            >
              <option value="not-started">Not started</option>
              <option value="in-progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="revision">Revision</option>
            </select>

            <button
              onClick={() => onAddChild(topic.id)}
              className="size-8 rounded-md hover:bg-accent grid place-items-center text-muted-foreground hover:text-foreground"
              aria-label="Add subtopic"
            >
              <Plus className="size-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="size-8 rounded-md hover:bg-accent grid place-items-center text-muted-foreground hover:text-foreground"
                aria-label="More"
              >
                <MoreHorizontal className="size-4" />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 mt-1 w-44 surface rounded-md border border-border shadow-elevated z-20 p-1"
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    <MenuBtn
                      onClick={() => {
                        setEditing(true);
                        setMenuOpen(false);
                      }}
                    >
                      <Pencil className="size-3.5" /> Rename
                    </MenuBtn>
                    <MenuBtn
                      onClick={() => {
                        setActive(topic.id);
                        setView("notes");
                        setMenuOpen(false);
                      }}
                    >
                      <FileText className="size-3.5" /> Open notes
                    </MenuBtn>
                    <MenuBtn
                      destructive
                      onClick={() => {
                        if (confirm(`Delete "${topic.title}" and all its content?`))
                          deleteTopic(topic.id);
                        setMenuOpen(false);
                      }}
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </MenuBtn>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <Modal
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          title="Topic details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Title</div>
              <div className="font-semibold tracking-tight">{topic.title}</div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Description</div>
              <div className="text-sm whitespace-pre-wrap">
                {topic.description?.trim() ? topic.description : "—"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Tags</div>
              <div className="flex flex-wrap gap-2">
                {extractedTags.length > 0 ? (
                  extractedTags.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1.5 rounded-full bg-accent text-sm text-muted-foreground"
                    >
                      #{t}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No tags</span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">URL</div>
              <div className="text-sm">
                {topic.url?.trim() ? (
                  (() => {
                    const urls = topic.url
                      .split(",")
                      .map((u) => u.trim())
                      .filter(Boolean);

                    if (!urls.length) return <span className="text-muted-foreground">—</span>;

                    return (
                      <div className="flex flex-row gap-2 flex-wrap">
                        {urls.map((u) => (
                          <a
                            key={u}
                            href={u}
                            target="_blank"
                            rel="noreferrer"
                            className="text-foreground underline underline-offset-4 hover:opacity-90 break-all"
                          >
                            {u}
                          </a>
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>





            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">Status</div>
              <StatusBadge status={topic.status} />
            </div>

            {/* <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Notes</div>
              <div className="text-sm whitespace-pre-wrap">
                {topic.notes?.trim() ? topic.notes : "—"}
              </div>
            </div> */}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs">Date added</div>
                <div className="font-medium">{format(topic.createdAt, "MMM d, yyyy")}</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs">Last studied</div>
                <div className="font-medium">
                  {topic.lastStudiedAt ? format(topic.lastStudiedAt, "MMM d, HH:mm") : "—"}
                </div>
              </div>
            </div>
          </div>
        </Modal>

        <AnimatePresence initial={false}>
          {open && children.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="pl-8 pr-3 pb-3">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => {
                    const { active, over } = e;
                    if (!over || active.id === over.id) return;
                    const ids = children.map((c) => c.id);
                    const next = arrayMove(
                      ids,
                      ids.indexOf(active.id as string),
                      ids.indexOf(over.id as string),
                    );
                    reorder(topic.id, next);
                  }}
                >
                  <SortableContext
                    items={children.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul className="space-y-2 border-l border-border pl-3">
                      {children.map((c) => (
                        <TopicNode
                          key={c.id}
                          topic={c}
                          level={level + 1}
                          onAddChild={onAddChild}
                          problems={problems}
                        />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </li>
  );
}

function MenuBtn({
  children,
  onClick,
  destructive,
}: {
  children: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full h-8 px-2 rounded-md flex items-center gap-2 text-xs hover:bg-accent ${
        destructive ? "text-destructive" : "text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="surface rounded-2xl border border-dashed border-border p-12 text-center">
      <h3 className="text-base font-semibold tracking-tight">Build your learning path</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
        Start with a high-level topic like "System Design" or "React." Add subtopics, notes, and
        problems as you go.
      </p>
      <button
        onClick={onAdd}
        className="mt-5 h-9 px-4 rounded-md bg-lime-600 text-primary-foreground text-sm font-medium hover:opacity-90 inline-flex items-center gap-1.5"
      >
        <Plus className="size-4" /> Create your first topic
      </button>
    </div>
  );
}
