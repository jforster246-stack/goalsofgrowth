import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  Check,
  IndentDecrease,
  IndentIncrease,
  MoreHorizontal,
  Repeat,
  Target,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { HabitFormModal } from "@/components/habit-form-modal";
import { Loading } from "@/components/loading";
import { brainDumpQueryOptions } from "@/lib/goal-queries";
import {
  createBrainDumpItem,
  deleteBrainDumpItem,
  reorderBrainDump,
  toggleBrainDumpItem,
  updateBrainDumpItem,
} from "@/lib/braindump.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/braindump")({
  head: () => ({
    meta: [
      { title: "Brain dump — Goals of Growth" },
      {
        name: "description",
        content: "One running list of everything you want to do or try. Just keep typing.",
      },
    ],
  }),
  component: BrainDumpPage,
});

type Item = {
  id: string;
  text: string;
  done: boolean;
  position: number;
  indent?: number;
};

const MAX_INDENT = 2;
const SAVE_DELAY = 500;

type Focus = { id: string; caret: number | "end" };

function BrainDumpPage() {
  const { data, isPending } = useQuery(brainDumpQueryOptions);

  return (
    <AppShell title="Brain dump" hideSettings>
      <div className="mt-2 w-full max-w-2xl pb-4">
        <p className="font-serif text-sm text-black/50">
          Everything you want to do or try. Just keep typing.
        </p>
        {isPending || !data ? <Loading /> : <BrainDumpList initial={data as Item[]} />}
      </div>
    </AppShell>
  );
}

/**
 * A Notion-style checklist. The list on screen is the source of truth: edits
 * show instantly and save in the background, so typing never waits on the
 * server or gets overwritten by a refetch.
 */
function BrainDumpList({ initial }: { initial: Item[] }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>(() =>
    [...initial].sort((a, b) => a.position - b.position),
  );
  const [focus, setFocus] = useState<Focus | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [habitPrefill, setHabitPrefill] = useState<string | null>(null);
  const refs = useRef(new Map<string, HTMLTextAreaElement>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const unsaved = useRef(new Map<string, string>());

  // Keep the shared cache in step so the + menu's quick add stays consistent.
  useEffect(() => {
    queryClient.setQueryData(["brain-dump"], items);
  }, [items, queryClient]);

  // Pick up items added elsewhere (the + menu) without clobbering local edits.
  useEffect(() => {
    setItems((current) => {
      const known = new Set(current.map((i) => i.id));
      const fresh = initial.filter((i) => !known.has(i.id));
      return fresh.length ? [...current, ...fresh] : current;
    });
  }, [initial]);

  // Move the caret after structural changes (new line, delete, merge).
  useLayoutEffect(() => {
    if (!focus) return;
    const el = refs.current.get(focus.id);
    if (el) {
      el.focus();
      const at = focus.caret === "end" ? el.value.length : focus.caret;
      el.setSelectionRange(at, at);
      setFocus(null);
    }
  }, [focus, items]);

  // Save any text still waiting when leaving the page.
  useEffect(() => {
    const pending = timers.current;
    const texts = unsaved.current;
    return () => {
      pending.forEach((t) => clearTimeout(t));
      texts.forEach((text, id) => void updateBrainDumpItem({ data: { id, text } }));
    };
  }, []);

  const saveOrder = (list: Item[]) => {
    if (list.length > 0) void reorderBrainDump({ data: { orderedIds: list.map((i) => i.id) } });
  };

  const cancelSave = (id: string) => {
    const existing = timers.current.get(id);
    if (existing) clearTimeout(existing);
    timers.current.delete(id);
    unsaved.current.delete(id);
  };

  const saveText = (id: string, text: string, now = false) => {
    cancelSave(id);
    unsaved.current.set(id, text);
    const run = () => {
      timers.current.delete(id);
      unsaved.current.delete(id);
      void updateBrainDumpItem({ data: { id, text } });
    };
    if (now) run();
    else timers.current.set(id, setTimeout(run, SAVE_DELAY));
  };

  const insertAfter = (index: number, text = "", indent = 0) => {
    const item: Item = {
      id: crypto.randomUUID(),
      text,
      done: false,
      position: index + 1,
      indent,
    };
    const next = [...items.slice(0, index + 1), item, ...items.slice(index + 1)];
    setItems(next);
    setFocus({ id: item.id, caret: 0 });
    void createBrainDumpItem({
      data: { id: item.id, text, position: index + 1, ...(indent ? { indent } : {}) },
    }).then(() => saveOrder(next));
  };

  const remove = (index: number, focusPrev = true) => {
    const item = items[index];
    if (!item) return;
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    const prev = next[index - 1];
    if (focusPrev && prev) setFocus({ id: prev.id, caret: "end" });
    cancelSave(item.id);
    void deleteBrainDumpItem({ data: { id: item.id } });
  };

  const setIndent = (index: number, indent: number) => {
    const item = items[index];
    if (!item) return;
    const value = Math.max(0, Math.min(MAX_INDENT, indent));
    if (value === (item.indent ?? 0)) return;
    setItems((list) => list.map((i, n) => (n === index ? { ...i, indent: value } : i)));
    void updateBrainDumpItem({ data: { id: item.id, indent: value } });
  };

  const toggle = (index: number) => {
    const item = items[index];
    if (!item) return;
    setItems((list) => list.map((i, n) => (n === index ? { ...i, done: !i.done } : i)));
    void toggleBrainDumpItem({ data: { id: item.id, done: !item.done } });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    const item = items[index]!;
    const el = e.currentTarget;
    const indent = item.indent ?? 0;
    const atStart = el.selectionStart === 0 && el.selectionEnd === 0;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Enter on an empty indented line steps it back out, like Notion.
      if (!el.value && indent > 0) {
        setIndent(index, indent - 1);
        return;
      }
      const before = el.value.slice(0, el.selectionStart);
      const after = el.value.slice(el.selectionEnd);
      if (after) {
        setItems((list) => list.map((i, n) => (n === index ? { ...i, text: before } : i)));
        saveText(item.id, before, true);
      }
      insertAfter(index, after, indent);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      setIndent(index, indent + (e.shiftKey ? -1 : 1));
      return;
    }

    if (e.key === "Backspace" && atStart) {
      if (indent > 0) {
        e.preventDefault();
        setIndent(index, indent - 1);
        return;
      }
      const prev = items[index - 1];
      if (!prev) return;
      e.preventDefault();
      // Join this line onto the one above.
      const joined = prev.text + el.value;
      setItems((list) => list.map((i, n) => (n === index - 1 ? { ...i, text: joined } : i)));
      saveText(prev.id, joined, true);
      remove(index, false);
      setFocus({ id: prev.id, caret: prev.text.length });
      return;
    }

    if (e.key === "ArrowUp" && el.selectionStart === 0) {
      const prev = items[index - 1];
      if (prev) {
        e.preventDefault();
        setFocus({ id: prev.id, caret: "end" });
      }
    }
    if (e.key === "ArrowDown" && el.selectionEnd === el.value.length) {
      const nextItem = items[index + 1];
      if (nextItem) {
        e.preventDefault();
        setFocus({ id: nextItem.id, caret: "end" });
      }
    }
  };

  return (
    <>
      <div className="mt-4 rounded-2xl bg-white px-2 py-3 shadow-sm sm:px-4">
        {items.map((item, index) => (
          <Row
            key={item.id}
            item={item}
            menuOpen={menuFor === item.id}
            registerRef={(el) => {
              if (el) refs.current.set(item.id, el);
              else refs.current.delete(item.id);
            }}
            onChange={(text) => {
              setItems((list) => list.map((i) => (i.id === item.id ? { ...i, text } : i)));
              saveText(item.id, text);
            }}
            onBlur={() => {
              if (timers.current.has(item.id)) saveText(item.id, item.text, true);
            }}
            onKeyDown={(e) => onKeyDown(e, index)}
            onToggle={() => toggle(index)}
            onMenu={() => setMenuFor(menuFor === item.id ? null : item.id)}
            onCloseMenu={() => setMenuFor(null)}
            onIndent={() => setIndent(index, (item.indent ?? 0) + 1)}
            onOutdent={() => setIndent(index, (item.indent ?? 0) - 1)}
            onMakeGoal={() => navigate({ to: "/goals/new", search: { title: item.text } })}
            onMakeHabit={() => setHabitPrefill(item.text)}
            onDelete={() => remove(index)}
          />
        ))}

        {/* The empty line at the bottom - tap it to start a new item. */}
        <button
          type="button"
          onClick={() => insertAfter(items.length - 1)}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-black/[0.03]"
        >
          <span className="size-5 shrink-0 rounded-md border-2 border-black/15" />
          <span className="font-serif text-[15px] text-black/30">
            {items.length === 0 ? "Start typing your first idea…" : "To-do"}
          </span>
        </button>
      </div>

      <p className="mt-3 text-center font-serif text-xs text-black/35">
        Enter for a new line · Tab to indent · ⋯ for more
      </p>

      {habitPrefill !== null && (
        <HabitFormModal initialName={habitPrefill} onClose={() => setHabitPrefill(null)} />
      )}
    </>
  );
}

function Row({
  item,
  menuOpen,
  registerRef,
  onChange,
  onBlur,
  onKeyDown,
  onToggle,
  onMenu,
  onCloseMenu,
  onIndent,
  onOutdent,
  onMakeGoal,
  onMakeHabit,
  onDelete,
}: {
  item: Item;
  menuOpen: boolean;
  registerRef: (el: HTMLTextAreaElement | null) => void;
  onChange: (text: string) => void;
  onBlur: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onToggle: () => void;
  onMenu: () => void;
  onCloseMenu: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  onMakeGoal: () => void;
  onMakeHabit: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const indent = item.indent ?? 0;

  // Grow the text box to fit long ideas.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [item.text]);

  return (
    <div
      className="group relative flex items-start gap-3 rounded-lg px-2 py-1 transition-colors focus-within:bg-black/[0.02] hover:bg-black/[0.02]"
      style={{ paddingLeft: `${8 + indent * 28}px` }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={item.done ? "Untick" : "Tick"}
        aria-pressed={item.done}
        className={cn(
          "mt-[3px] grid size-5 shrink-0 place-items-center rounded-md border-2 transition-colors",
          item.done ? "border-olive bg-olive text-white" : "border-black/30 hover:border-olive/60",
        )}
      >
        {item.done && <Check className="size-3.5" strokeWidth={3} />}
      </button>

      <textarea
        ref={(el) => {
          ref.current = el;
          registerRef(el);
        }}
        value={item.text}
        rows={1}
        maxLength={500}
        aria-label="Idea"
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className={cn(
          "min-w-0 flex-1 resize-none overflow-hidden bg-transparent py-0.5 font-serif text-[15px] leading-relaxed focus:outline-none",
          item.done ? "text-black/35 line-through" : "text-black",
        )}
      />

      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={onMakeGoal}
          aria-label="Make it a goal"
          title="Make it a goal"
          className="grid size-8 place-items-center rounded-lg text-olive transition-colors hover:bg-black/5"
        >
          <Target className="size-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={onMakeHabit}
          aria-label="Make it a habit"
          title="Make it a habit"
          className="grid size-8 place-items-center rounded-lg text-olive transition-colors hover:bg-black/5"
        >
          <Repeat className="size-4" strokeWidth={2} />
        </button>
      </div>

      <button
        type="button"
        onClick={onMenu}
        aria-label="More options"
        className={cn(
          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-md text-black/35 transition-opacity hover:bg-black/5 hover:text-black/70",
          menuOpen
            ? "opacity-100"
            : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
        )}
      >
        <MoreHorizontal className="size-4" />
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 cursor-default"
            onClick={onCloseMenu}
          />
          <div className="absolute right-2 top-9 z-40 w-44 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-black/10">
            {indent < MAX_INDENT && (
              <MenuItem
                Icon={IndentIncrease}
                label="Indent"
                onClick={() => {
                  onCloseMenu();
                  onIndent();
                }}
              />
            )}
            {indent > 0 && (
              <MenuItem
                Icon={IndentDecrease}
                label="Outdent"
                onClick={() => {
                  onCloseMenu();
                  onOutdent();
                }}
              />
            )}
            <MenuItem
              Icon={Trash2}
              label="Delete"
              danger
              onClick={() => {
                onCloseMenu();
                onDelete();
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  Icon,
  label,
  danger,
  onClick,
}: {
  Icon: typeof Target;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-2 text-left font-serif text-sm transition-colors hover:bg-black/5",
        danger ? "text-clay-deep" : "text-black/75",
      )}
    >
      <Icon className="size-4" strokeWidth={2} />
      {label}
    </button>
  );
}
