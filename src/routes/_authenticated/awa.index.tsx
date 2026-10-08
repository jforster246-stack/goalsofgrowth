import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, GripVertical, List, Plus, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Loading } from "@/components/loading";
import { localToday } from "@/components/goal-ui";
import { AwaLogModal, formatAwaTime, type AwaEditLog } from "@/components/awa-log-modal";
import { AwaHobbyModal } from "@/components/awa-hobby-modal";
import {
  HobbyIcon,
  durationLabel,
  hobbyAccent,
  shortDate,
  useAwaPhotoUrls,
  type AwaHobby,
  type AwaLog,
} from "@/components/awa-ui";
import {
  awaHobbiesQueryOptions,
  awaLogsQueryOptions,
  awaWishlistQueryOptions,
} from "@/lib/goal-queries";
import {
  addAwaWishlistItem,
  deleteAwaHobby,
  deleteAwaWishlistItem,
  reorderAwaHobbies,
  setAwaHobbyPutAway,
  toggleAwaWishlistItem,
} from "@/lib/awa.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/awa/")({
  head: () => ({
    meta: [
      { title: "A While Away — Goals of Growth" },
      {
        name: "description",
        content:
          "A shelf of the hobbies you love, and a little record of the times you actually did them.",
      },
    ],
  }),
  component: AwaPage,
});

type Wish = { id: string; title: string; done: boolean };

type Tab = "shelf" | "did" | "someday";
const TABS: { key: Tab; label: string }[] = [
  { key: "shelf", label: "Shelf" },
  { key: "did", label: "Things I did" },
  { key: "someday", label: "Someday" },
];

const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** "drawing, reading and cooking" */
function joinNames(names: string[]) {
  const lower = names.map((n) => n.toLowerCase());
  if (lower.length <= 1) return lower[0] ?? "";
  return `${lower.slice(0, -1).join(", ")} and ${lower[lower.length - 1]}`;
}

function AwaPage() {
  const [tab, setTab] = useState<Tab>("shelf");
  const [logFor, setLogFor] = useState<{ hobbyId?: string; note?: string } | null>(null);
  const [addingHobby, setAddingHobby] = useState(false);
  const { data: hobbies } = useQuery(awaHobbiesQueryOptions);
  const active = ((hobbies ?? []) as AwaHobby[]).filter((h) => !h.archived_at);

  return (
    <AppShell title="A While Away" hideSettings>
      <div className="mt-2 w-full pb-4">
        <p className="font-serif text-sm italic text-black/45">
          Things I want to spend time doing.
        </p>

        <div className="mt-4 flex gap-1.5 rounded-full bg-black/5 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 whitespace-nowrap rounded-full px-3 py-1.5 font-heading text-[11px] uppercase tracking-wide transition-colors",
                tab === t.key ? "bg-white text-olive shadow-sm" : "text-black/45",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab !== "someday" && active.length > 0 && (
          <button
            type="button"
            onClick={() => setLogFor({})}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-olive py-3.5 font-heading text-sm uppercase text-white shadow-sm transition-colors hover:bg-olive/90"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Log a little time
          </button>
        )}

        <div className="mt-6">
          {tab === "shelf" && (
            <ShelfTab
              onLog={(hobbyId) => setLogFor({ hobbyId })}
              onAdd={() => setAddingHobby(true)}
            />
          )}
          {tab === "did" && <ThingsIDidTab />}
          {tab === "someday" && <SomedayTab onLogItem={(note) => setLogFor({ note })} />}
        </div>
      </div>

      {logFor && (
        <AwaLogModal
          hobbies={logFor.hobbyId ? active.filter((h) => h.id === logFor.hobbyId) : active}
          initialHobbyId={logFor.hobbyId}
          lockHobby={!!logFor.hobbyId}
          prefillNote={logFor.note}
          onAddHobby={() => {
            setLogFor(null);
            setTab("shelf");
            setAddingHobby(true);
          }}
          onClose={() => setLogFor(null)}
        />
      )}
      {addingHobby && <AwaHobbyModal onClose={() => setAddingHobby(false)} />}
    </AppShell>
  );
}

/* --------------------------------- Shelf -------------------------------- */

function ShelfTab({ onLog, onAdd }: { onLog: (hobbyId: string) => void; onAdd: () => void }) {
  const { data: hobbies, isPending } = useQuery(awaHobbiesQueryOptions);
  const { data: logs } = useQuery(awaLogsQueryOptions);
  const [arranging, setArranging] = useState(false);

  const all = (hobbies ?? []) as AwaHobby[];
  const active = all.filter((h) => !h.archived_at);
  const putAway = all.filter((h) => !!h.archived_at);

  // Per hobby: how many times, plus the newest note and newest photo.
  const stats = useMemo(() => {
    const m = new Map<string, { count: number; note: string | null; photo: string | null }>();
    // Logs arrive newest first, so the first note/photo seen is the latest.
    for (const l of (logs ?? []) as AwaLog[]) {
      if (!l.hobby_id) continue;
      const s = m.get(l.hobby_id) ?? { count: 0, note: null, photo: null };
      s.count += 1;
      if (!s.note && l.note) s.note = l.note;
      if (!s.photo && l.photo_path) s.photo = l.photo_path;
      m.set(l.hobby_id, s);
    }
    return m;
  }, [logs]);

  const photoUrls = useAwaPhotoUrls(active.map((h) => stats.get(h.id)?.photo));

  if (isPending) return <Loading />;

  if (active.length === 0 && putAway.length === 0) {
    return (
      <div className="rounded-3xl bg-white px-6 py-10 text-center shadow-sm">
        <HobbyIcon icon={null} className="mx-auto size-10 text-sage" />
        <h2 className="mt-4 font-display text-3xl leading-tight text-black">
          What do you want to spend a little more time doing?
        </h2>
        <p className="mx-auto mt-3 max-w-xs font-serif text-sm text-black/55">
          Add the hobbies you're curious about, miss doing, or simply want to make room for.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-6 inline-flex items-center gap-1.5 rounded-2xl bg-olive px-6 py-3.5 font-heading text-sm uppercase text-white shadow-sm transition-colors hover:bg-olive/90"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          Add your first hobby
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {arranging ? (
        <ArrangeShelf hobbies={active} onDone={() => setArranging(false)} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {active.map((h) => {
              const s = stats.get(h.id);
              return (
                <ShelfCard
                  key={h.id}
                  hobby={h}
                  count={s?.count ?? 0}
                  note={s?.note ?? null}
                  photoUrl={s?.photo ? photoUrls[s.photo] : undefined}
                  onLog={() => onLog(h.id)}
                />
              );
            })}
            <button
              type="button"
              onClick={onAdd}
              className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-olive/35 font-heading text-xs uppercase text-olive transition-colors hover:bg-olive/5"
            >
              <Plus className="size-5" strokeWidth={2} />
              Add hobby
            </button>
          </div>
          {active.length > 1 && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setArranging(true)}
                className="font-heading text-xs uppercase text-black/40 transition-colors hover:text-olive"
              >
                Arrange shelf
              </button>
            </div>
          )}
        </>
      )}

      {putAway.length > 0 && !arranging && <PutAwayList hobbies={putAway} />}
    </div>
  );
}

function ShelfCard({
  hobby,
  count,
  note,
  photoUrl,
  onLog,
}: {
  hobby: AwaHobby;
  count: number;
  note: string | null;
  photoUrl: string | undefined;
  onLog: () => void;
}) {
  const style = hobbyAccent(hobby.accent);
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm transition-transform hover:-translate-y-0.5">
      <Link
        to="/awa/$hobbyId"
        params={{ hobbyId: hobby.id }}
        className="block"
        aria-label={`Open ${hobby.name}`}
      >
        <div
          className={cn(
            "relative grid aspect-[4/3] place-items-center overflow-hidden text-4xl text-white",
            style.surface,
          )}
        >
          {photoUrl ? (
            <img src={photoUrl} alt="" className="absolute inset-0 size-full object-cover" />
          ) : (
            <HobbyIcon icon={hobby.icon} className="size-12" />
          )}
        </div>
        <div className="px-3 pt-2.5 pb-3">
          <p className="truncate font-heading text-sm text-black">{hobby.name}</p>
          <p className={cn("font-serif text-xs", style.text)}>
            {count === 0 ? "Waiting for you" : `${count} ${count === 1 ? "time" : "times"}`}
          </p>
          <p className="mt-0.5 line-clamp-2 font-serif text-[11px] leading-snug text-black/45">
            {note ?? hobby.description ?? ""}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={onLog}
        aria-label={`Log time on ${hobby.name}`}
        className="absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-white/90 text-olive shadow-sm transition-colors hover:bg-white"
      >
        <Plus className="size-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}

/** One-column drag list for putting the shelf in your own order. */
function ArrangeShelf({ hobbies, onDone }: { hobbies: AwaHobby[]; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState(hobbies);
  useEffect(() => setItems(hobbies), [hobbies]);

  const save = useMutation({
    mutationFn: (orderedIds: string[]) => reorderAwaHobbies({ data: { orderedIds } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["awa-hobbies"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-serif text-sm text-black/55">Drag to arrange your shelf.</p>
        <button
          type="button"
          onClick={() => {
            save.mutate(items.map((h) => h.id));
            onDone();
          }}
          className="rounded-full bg-olive px-4 py-2 font-heading text-xs uppercase text-white transition-colors hover:bg-olive/90"
        >
          Done
        </button>
      </div>
      <Reorder.Group
        as="div"
        axis="y"
        values={items}
        onReorder={setItems}
        className="mt-3 space-y-2"
      >
        {items.map((h) => (
          <ArrangeRow key={h.id} hobby={h} />
        ))}
      </Reorder.Group>
    </div>
  );
}

function ArrangeRow({ hobby }: { hobby: AwaHobby }) {
  const controls = useDragControls();
  const style = hobbyAccent(hobby.accent);
  return (
    <Reorder.Item as="div" value={hobby} dragListener={false} dragControls={controls}>
      <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-sm">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl text-lg text-white",
            style.surface,
          )}
        >
          <HobbyIcon icon={hobby.icon} className="size-5" />
        </span>
        <span className="min-w-0 flex-1 truncate font-heading text-sm text-black">
          {hobby.name}
        </span>
        <button
          type="button"
          aria-label={`Drag ${hobby.name}`}
          onPointerDown={(e) => controls.start(e)}
          className="grid size-9 shrink-0 cursor-grab touch-none place-items-center text-black/30 active:cursor-grabbing"
        >
          <GripVertical className="size-5" />
        </button>
      </div>
    </Reorder.Item>
  );
}

function PutAwayList({ hobbies }: { hobbies: AwaHobby[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["awa-hobbies"] });

  const bringBack = useMutation({
    mutationFn: (id: string) => setAwaHobbyPutAway({ data: { id, putAway: false } }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteAwaHobby({ data: { id } }),
    onSuccess: refresh,
  });

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="font-heading text-xs uppercase text-black/40 transition-colors hover:text-olive"
      >
        {open ? "Hide" : "Show"} put away ({hobbies.length})
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {hobbies.map((h) => (
            <div key={h.id} className="flex items-center gap-3 rounded-2xl bg-white/60 px-3 py-2.5">
              <HobbyIcon icon={h.icon} className="size-5 text-lg text-black/40" />
              <span className="min-w-0 flex-1 truncate font-serif text-sm text-black/60">
                {h.name}
              </span>
              <button
                type="button"
                onClick={() => bringBack.mutate(h.id)}
                className="rounded-full bg-olive/10 px-3 py-1.5 font-heading text-[10px] uppercase text-olive transition-colors hover:bg-olive/20"
              >
                Bring back
              </button>
              <button
                type="button"
                onClick={() => (confirmId === h.id ? remove.mutate(h.id) : setConfirmId(h.id))}
                className="rounded-full px-2 py-1.5 font-heading text-[10px] uppercase text-clay-deep/70 transition-colors hover:bg-clay/10"
              >
                {confirmId === h.id ? "Sure?" : "Delete"}
              </button>
            </div>
          ))}
          <p className="font-serif text-xs text-black/40">
            Deleting removes the hobby from your shelf for good. Its memories stay in Things I did.
          </p>
        </div>
      )}
    </section>
  );
}

/* ------------------------------ Things I did ---------------------------- */

function ThingsIDidTab() {
  const { data: logs, isPending } = useQuery(awaLogsQueryOptions);
  const { data: hobbies } = useQuery(awaHobbiesQueryOptions);
  const [filter, setFilter] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [editLog, setEditLog] = useState<AwaLog | null>(null);

  const all = (logs ?? []) as AwaLog[];
  const hobbyList = (hobbies ?? []) as AwaHobby[];
  const byId = new Map(hobbyList.map((h) => [h.id, h]));
  const filterKey = (l: AwaLog) => l.hobby_id ?? `name:${l.hobby_name}`;

  // Filter chips: every hobby that has at least one memory.
  const chips = useMemo(() => {
    const seen = new Map<string, { key: string; name: string; icon: string | null }>();
    for (const l of all) {
      const key = filterKey(l);
      if (!seen.has(key)) {
        const h = l.hobby_id ? byId.get(l.hobby_id) : undefined;
        seen.set(key, { key, name: h?.name ?? l.hobby_name, icon: h?.icon ?? l.hobby_icon });
      }
    }
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, hobbies]);

  const shown = filter ? all.filter((l) => filterKey(l) === filter) : all;

  if (isPending) return <Loading />;
  if (all.length === 0) {
    return (
      <div className="rounded-3xl bg-white px-6 py-10 text-center shadow-sm">
        <p className="font-display text-2xl text-black">Nothing here yet.</p>
        <p className="mx-auto mt-2 max-w-xs font-serif text-sm text-black/55">
          Whenever you spend a little time on something you enjoy, it'll show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="-mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 pb-1">
          <button
            type="button"
            onClick={() => setFilter(null)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 font-heading text-[11px] uppercase transition-colors",
              !filter ? "bg-olive text-white" : "bg-white text-black/55 shadow-sm",
            )}
          >
            Everything
          </button>
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setFilter(c.key === filter ? null : c.key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-serif text-xs transition-colors",
                filter === c.key ? "bg-olive text-white" : "bg-white text-black/65 shadow-sm",
              )}
            >
              <HobbyIcon icon={c.icon} className="size-3.5 text-sm" />
              {c.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setView(view === "list" ? "calendar" : "list")}
          aria-label={view === "list" ? "Show calendar" : "Show list"}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-olive shadow-sm transition-colors hover:bg-white/70"
        >
          {view === "list" ? <CalendarDays className="size-4" /> : <List className="size-4" />}
        </button>
      </div>

      {view === "list" ? (
        <Timeline logs={shown} byId={byId} onOpen={setEditLog} />
      ) : (
        <CalendarView logs={shown} byId={byId} onOpen={setEditLog} />
      )}

      {editLog && (
        <AwaLogModal
          hobbies={[]}
          lockHobby
          editLog={editLog as AwaEditLog}
          onClose={() => setEditLog(null)}
        />
      )}
    </div>
  );
}

function Timeline({
  logs,
  byId,
  onOpen,
}: {
  logs: AwaLog[];
  byId: Map<string, AwaHobby>;
  onOpen: (log: AwaLog) => void;
}) {
  const photoUrls = useAwaPhotoUrls(logs.map((l) => l.photo_path));
  const months = useMemo(() => {
    const groups: { key: string; logs: AwaLog[] }[] = [];
    for (const l of logs) {
      const key = l.logged_on.slice(0, 7);
      const last = groups[groups.length - 1];
      if (last?.key === key) last.logs.push(l);
      else groups.push({ key, logs: [l] });
    }
    return groups;
  }, [logs]);

  return (
    <div className="space-y-7">
      {months.map((m) => {
        const [y, mo] = m.key.split("-").map(Number);
        const names = [
          ...new Set(m.logs.map((l) => byId.get(l.hobby_id ?? "")?.name ?? l.hobby_name)),
        ];
        return (
          <section key={m.key}>
            <p className="font-heading text-sm uppercase text-olive">
              {MONTHS[(mo ?? 1) - 1]} {y}
            </p>
            <p className="mt-0.5 font-serif text-xs italic text-black/45">
              You made time for {joinNames(names)}.
            </p>
            <div className="mt-3 space-y-2">
              {m.logs.map((l) => (
                <MemoryRow
                  key={l.id}
                  log={l}
                  hobby={l.hobby_id ? byId.get(l.hobby_id) : undefined}
                  photoUrl={l.photo_path ? photoUrls[l.photo_path] : undefined}
                  onClick={() => onOpen(l)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function MemoryRow({
  log,
  hobby,
  photoUrl,
  onClick,
}: {
  log: AwaLog;
  hobby: AwaHobby | undefined;
  photoUrl: string | undefined;
  onClick: () => void;
}) {
  const style = hobbyAccent(hobby?.accent);
  const when =
    durationLabel(log.duration) ?? (log.activity_time ? formatAwaTime(log.activity_time) : null);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-2xl bg-white px-3 py-3 text-left shadow-sm transition-colors hover:bg-white/80"
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl text-lg text-white",
          style.surface,
        )}
      >
        <HobbyIcon icon={hobby?.icon ?? log.hobby_icon} className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-heading text-sm text-black">
            {hobby?.name ?? log.hobby_name}
          </span>
          <span className="shrink-0 font-serif text-xs text-black/40">
            {shortDate(log.logged_on)}
          </span>
        </span>
        {log.note && (
          <span className="mt-0.5 block font-serif text-sm text-black/70">{log.note}</span>
        )}
        {when && <span className="mt-0.5 block font-serif text-xs text-black/40">{when}</span>}
      </span>
      {photoUrl && (
        <img src={photoUrl} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
      )}
    </button>
  );
}

function CalendarView({
  logs,
  byId,
  onOpen,
}: {
  logs: AwaLog[];
  byId: Map<string, AwaHobby>;
  onOpen: (log: AwaLog) => void;
}) {
  const [offset, setOffset] = useState(0);
  const [day, setDay] = useState<string | null>(null);

  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const year = base.getFullYear();
  const month = base.getMonth();
  const monthKey = `${year}-${pad(month + 1)}`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const today = localToday();

  const byDay = useMemo(() => {
    const m = new Map<string, AwaLog[]>();
    for (const l of logs) {
      if (l.logged_on.slice(0, 7) !== monthKey) continue;
      m.set(l.logged_on, [...(m.get(l.logged_on) ?? []), l]);
    }
    return m;
  }, [logs, monthKey]);

  const dayLogs = day ? (byDay.get(day) ?? []) : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-heading text-sm uppercase text-olive">
          {MONTHS[month]} {year}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => {
              setOffset((o) => o - 1);
              setDay(null);
            }}
            className="grid size-8 place-items-center rounded-full bg-white shadow-sm transition-colors hover:bg-white/70"
          >
            <ChevronLeft className="size-4 text-olive" strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Next month"
            disabled={offset >= 0}
            onClick={() => {
              setOffset((o) => o + 1);
              setDay(null);
            }}
            className="grid size-8 place-items-center rounded-full bg-white shadow-sm transition-colors hover:bg-white/70 disabled:opacity-40"
          >
            <ChevronRight className="size-4 text-olive" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <div className="grid grid-cols-7 gap-1">
          {WEEK_LABELS.map((l, i) => (
            <div key={i} className="pb-1 text-center font-serif text-[10px] text-black/35">
              {l}
            </div>
          ))}
          {Array.from({ length: firstDow }, (_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
            const date = `${monthKey}-${pad(d)}`;
            const entries = byDay.get(date) ?? [];
            return (
              <button
                key={d}
                type="button"
                onClick={() => entries.length > 0 && setDay(date === day ? null : date)}
                className={cn(
                  "flex aspect-square flex-col items-center rounded-lg p-1 transition-colors",
                  entries.length > 0 ? "bg-sage/15 hover:bg-sage/25" : "",
                  date === today && "ring-1 ring-focus",
                  date === day && "bg-sage/35",
                )}
              >
                <span
                  className={cn(
                    "font-mono text-[10px]",
                    date === today ? "text-focus" : "text-black/40",
                  )}
                >
                  {d}
                </span>
                <span className="mt-0.5 flex flex-wrap justify-center gap-px text-olive">
                  {entries.slice(0, 2).map((l) => (
                    <HobbyIcon
                      key={l.id}
                      icon={byId.get(l.hobby_id ?? "")?.icon ?? l.hobby_icon}
                      className="size-3 text-[10px]"
                    />
                  ))}
                  {entries.length > 2 && (
                    <span className="text-[8px] text-black/40">+{entries.length - 2}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {day && (
        <div className="space-y-2">
          {dayLogs.map((l) => (
            <MemoryRow
              key={l.id}
              log={l}
              hobby={l.hobby_id ? byId.get(l.hobby_id) : undefined}
              photoUrl={undefined}
              onClick={() => onOpen(l)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Someday ------------------------------- */

function SomedayTab({ onLogItem }: { onLogItem: (title: string) => void }) {
  const queryClient = useQueryClient();
  const { data: wishlist, isPending } = useQuery(awaWishlistQueryOptions);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["awa-wishlist"] });

  const [title, setTitle] = useState("");

  const add = useMutation({
    mutationFn: () => addAwaWishlistItem({ data: { title: title.trim() } }),
    onSuccess: () => {
      setTitle("");
      invalidate();
    },
  });
  const toggle = useMutation({
    mutationFn: (v: { id: string; done: boolean }) => toggleAwaWishlistItem({ data: v }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteAwaWishlistItem({ data: { id } }),
    onSuccess: invalidate,
  });

  const list = (wishlist ?? []) as Wish[];
  const canAdd = title.trim().length > 0 && !add.isPending;

  return (
    <div className="space-y-6">
      <p className="font-serif text-sm text-black/55">
        Little things you'd love to try one day. No rush.
      </p>
      <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && canAdd && add.mutate()}
          placeholder="Something you'd like to try…"
          maxLength={140}
          className="min-w-0 flex-1 bg-transparent px-1 font-serif text-sm placeholder:text-black/40 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => canAdd && add.mutate()}
          disabled={!canAdd}
          aria-label="Add to someday"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-olive text-white transition-colors hover:bg-olive/90 disabled:opacity-30"
        >
          <Plus className="size-4" strokeWidth={2.5} />
        </button>
      </div>

      {isPending ? (
        <Loading />
      ) : list.length === 0 ? (
        <p className="rounded-2xl bg-white/60 px-4 py-6 text-center font-serif text-sm text-black/40">
          Nothing here yet. Add anything you're curious about.
        </p>
      ) : (
        <div className="space-y-2">
          {list.map((w) => (
            <div
              key={w.id}
              className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm"
            >
              <button
                type="button"
                onClick={() => toggle.mutate({ id: w.id, done: !w.done })}
                aria-label={w.done ? "Mark as not tried yet" : "Mark as tried"}
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
                  w.done ? "border-olive bg-olive text-white" : "border-black/20",
                )}
              >
                {w.done && <span className="text-xs">✓</span>}
              </button>
              <span
                className={cn(
                  "min-w-0 flex-1 font-serif text-sm",
                  w.done ? "text-black/40" : "text-black",
                )}
              >
                {w.title}
              </span>
              {w.done && (
                <button
                  type="button"
                  onClick={() => onLogItem(w.title)}
                  className="shrink-0 rounded-full bg-sage/30 px-3 py-1 font-heading text-[10px] uppercase text-olive transition-colors hover:bg-sage/50"
                >
                  Keep a record
                </button>
              )}
              <button
                type="button"
                onClick={() => remove.mutate(w.id)}
                aria-label={`Remove ${w.title}`}
                className="grid size-7 shrink-0 place-items-center rounded-full text-black/25 transition-colors hover:bg-black/5 hover:text-clay-deep"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
