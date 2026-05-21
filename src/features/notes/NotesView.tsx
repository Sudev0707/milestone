import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Copy, Check, FileText } from "lucide-react";
import { useApp } from "@/store/app";

export function NotesView() {
  const topics = useApp((s) => s.topics);
  const activeId = useApp((s) => s.activeTopicId);
  const setActive = useApp((s) => s.setActiveTopic);
  const setNotes = useApp((s) => s.setTopicNotes);

  useEffect(() => {
    if (!activeId && topics.length > 0) setActive(topics[0].id);
  }, [activeId, topics, setActive]);

  const topic = topics.find((t) => t.id === activeId) ?? null;
  const [draft, setDraft] = useState(topic?.notes ?? "");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setDraft(topic?.notes ?? "");
  }, [topic?.id]); // eslint-disable-line

  // Autosave (debounced)
  useEffect(() => {
    if (!topic) return;
    if (draft === topic.notes) return;
    const t = setTimeout(() => {
      setNotes(topic.id, draft);
      setSavedAt(Date.now());
    }, 500);
    return () => clearTimeout(t);
  }, [draft, topic, setNotes]);

  if (topics.length === 0) {
    return (
      <div className="surface border border-dashed border-border rounded-2xl p-12 text-center">
        <FileText className="size-6 mx-auto text-muted-foreground" />
        <h3 className="mt-3 font-semibold tracking-tight">No notes yet</h3>
        <p className="text-sm text-muted-foreground">Create a topic in the roadmap to start taking notes.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 h-[calc(100vh-9rem)]">
      <aside className="surface rounded-2xl border border-border p-2 overflow-y-auto">
        {topics.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`w-full text-left text-sm px-3 py-2 rounded-md transition truncate ${
              t.id === activeId ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            }`}
          >
            {t.title}
          </button>
        ))}
      </aside>

      {topic && (
        <motion.div
          key={topic.id}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="surface rounded-2xl border border-border overflow-hidden flex flex-col"
        >
          <div className="h-12 px-4 border-b border-border flex items-center justify-between">
            <div className="font-medium text-sm truncate">{topic.title}</div>
            <div className="text-xs text-muted-foreground">
              {savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString()}` : "Autosaves"}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 flex-1 min-h-0">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="# Heading&#10;&#10;Write markdown notes…&#10;&#10;```ts&#10;const x = 1;&#10;```"
              className="resize-none w-full h-full bg-transparent outline-none p-5 font-mono text-[13px] leading-6 border-r border-border"
            />
            <Preview md={draft} />
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Preview({ md }: { md: string }) {
  const content = useMemo(() => md, [md]);
  return (
    <div className="overflow-y-auto p-5 prose-styles">
      <article className="max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            h1: ({ ...p }) => <h1 className="text-2xl font-semibold tracking-tight mt-2 mb-3" {...p} />,
            h2: ({ ...p }) => <h2 className="text-lg font-semibold tracking-tight mt-5 mb-2" {...p} />,
            h3: ({ ...p }) => <h3 className="text-base font-semibold mt-4 mb-1.5" {...p} />,
            p: ({ ...p }) => <p className="text-sm leading-7 text-foreground/90 my-2" {...p} />,
            ul: ({ ...p }) => <ul className="list-disc pl-5 my-2 text-sm leading-7" {...p} />,
            ol: ({ ...p }) => <ol className="list-decimal pl-5 my-2 text-sm leading-7" {...p} />,
            a: ({ ...p }) => <a className="text-primary underline underline-offset-4" {...p} />,
            blockquote: ({ ...p }) => <blockquote className="border-l-2 border-border pl-3 my-3 text-muted-foreground italic" {...p} />,
            code: ({ inline, className, children, ...rest }: any) =>
              inline ? (
                <code className="px-1.5 py-0.5 rounded bg-muted text-[12px]" {...rest}>{children}</code>
              ) : (
                <CodeBlock className={className}>{String(children)}</CodeBlock>
              ),
          }}
        >
          {content || "_Start writing to see preview…_"}
        </ReactMarkdown>
      </article>
    </div>
  );
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative my-3">
      <button
        onClick={() => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
        className="absolute right-2 top-2 size-7 rounded-md bg-background/80 border border-border grid place-items-center text-muted-foreground hover:text-foreground"
        aria-label="Copy"
      >
        {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      </button>
      <pre className="overflow-x-auto rounded-lg">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}
