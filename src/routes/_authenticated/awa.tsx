import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Plus, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Loading } from "@/components/loading";
import { localToday } from "@/components/goal-ui";
import {
  awaHobbiesQueryOptions,
  awaLogsQueryOptions,
  awaWishlistQueryOptions,
} from "@/lib/goal-queries";
import {
  addAwaHobby,
  addAwaLog,
  addAwaWishlistItem,
  deleteAwaHobby,
  deleteAwaLog,
  deleteAwaWishlistItem,
  toggleAwaWishlistItem,
} from "@/lib/awa.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/awa")({
  head: () => ({
    meta: [
      { title: "A While Away — Goals of Growth" },
      {
        name: "description",
        content:
          "A calm hobby tracker — a shelf of the things you like to do, logged whenever you spend a while away, shown on a simple calendar.",
      },
    ],
  }),
  component: AwaPage,
});

type Hobby = {
  id: string;
  name: string;
  icon: string | null;
  category: string | null;
  created_at: string;
};
type Log = {
  id: string;
  hobby_id: string | null;
  hobby_name: string;
  hobby_icon: string | null;
  minutes: number;
  note: string | null;
  logged_on: string;
};
type Wish = { id: string; title: string; done: boolean };

type Tab = "shelf" | "calendar" | "want";
const TABS: { key: Tab; label: string }[] = [
  { key: "shelf", label: "Shelf" },
  { key: "calendar", label: "Calendar" },
  { key: "want", label: "Want to do" },
];

const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function fmtMins(mins: number): string {
  if (mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return [h ? `${h}h` : "", m ? `${m}m` : ""].filter(Boolean).join(" ");
}
function pad(n: number) {
  return String(n).padStart(2, "0");
}

function AwaPage() {
  const [tab, setTab] = useState<Tab>("shelf");
  // Opening the log sheet: optionally preselect a hobby and/or prefill a note.
  const [logState, setLogState] = useState<{ hobbyId?: string; note?: string } | null>(
    null,
  );

  const { data: hobbies } = useQuery(awaHobbiesQueryOptions);

  return (
    <AppShell title="A While Away" hideSettings>
      <div className="mt-2 pb-4">
        <p className="font-serif text-sm italic text-black/45">
          Time outside of work and everyday things — enjoyed, not optimised.
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

        <div className="mt-6">
          {tab === "shelf" && (
            <ShelfTab onLog={(h) => setLogState({ hobbyId: h.id })} />
          )}
          {tab === "calendar" && <CalendarTab />}
          {tab === "want" && (
            <WantTab onLogItem={(title) => setLogState({ note: title })} />
          )}
        </div>
      </div>

      {logState && (
        <LogModal
          hobbies={(hobbies ?? []) as Hobby[]}
          initialHobbyId={logState.hobbyId}
          prefillNote={logState.note}
          onAddHobby={() => {
            setLogState(null);
            setTab("shelf");
          }}
          onClose={() => setLogState(null)}
        />
      )}
    </AppShell>
  );
}

/* --------------------------------- Shelf -------------------------------- */

type Sort = "recent" | "oldest" | "most";
const SORTS: { key: Sort; label: string }[] = [
  { key: "recent", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "most", label: "Most done" },
];

function ShelfTab({ onLog }: { onLog: (hobby: Hobby) => void }) {
  const queryClient = useQueryClient();
  const { data: hobbies, isPending } = useQuery(awaHobbiesQueryOptions);
  const { data: logs } = useQuery(awaLogsQueryOptions);
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["awa-hobbies"] });

  const [icon, setIcon] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("recent");

  const add = useMutation({
    mutationFn: () =>
      addAwaHobby({
        data: {
          name: name.trim(),
          ...(icon.trim() ? { icon: icon.trim() } : {}),
          ...(category.trim() ? { category: category.trim() } : {}),
        },
      }),
    onSuccess: () => {
      setIcon("");
      setName("");
      setCategory("");
      setErr(null);
      invalidate();
    },
    onError: (e) =>
      setErr(e instanceof Error ? e.message : "Couldn't add that hobby."),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteAwaHobby({ data: { id } }),
    onSuccess: invalidate,
  });

  // Count logs per hobby.
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of (logs ?? []) as Log[]) {
      if (l.hobby_id) m.set(l.hobby_id, (m.get(l.hobby_id) ?? 0) + 1);
    }
    return m;
  }, [logs]);

  const list = useMemo(() => {
    const arr = [...((hobbies ?? []) as Hobby[])];
    arr.sort((a, b) => {
      if (sort === "most") return (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0);
      const at = a.created_at;
      const bt = b.created_at;
      return sort === "oldest" ? (at < bt ? -1 : 1) : at < bt ? 1 : -1;
    });
    return arr;
  }, [hobbies, sort, counts]);

  const canAdd = name.trim().length > 0 && !add.isPending;

  return (
    <div className="space-y-6">
      {/* Add a hobby to the shelf */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="font-heading text-sm uppercase text-olive">Add to your shelf</p>
        <div className="mt-3 flex items-center gap-2">
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value.slice(0, 2))}
            placeholder="🎨"
            aria-label="Emoji"
            className="w-14 rounded-2xl bg-black/5 px-3 py-3 text-center text-lg focus:outline-none focus:ring-1 focus:ring-olive/40"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canAdd && add.mutate()}
            placeholder="Name"
            maxLength={80}
            className="min-w-0 flex-1 rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canAdd && add.mutate()}
            placeholder="Category (optional)"
            maxLength={60}
            className="min-w-0 flex-1 rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
          />
          <button
            type="button"
            onClick={() => canAdd && add.mutate()}
            disabled={!canAdd}
            className="shrink-0 rounded-2xl bg-olive px-4 py-3 font-heading text-sm uppercase text-white transition-colors hover:bg-olive/90 disabled:opacity-40"
          >
            Add
          </button>
        </div>
        {err && (
          <p className="mt-3 rounded-xl bg-clay-deep/10 px-3 py-2 font-serif text-sm text-clay-deep">
            {err}
          </p>
        )}
      </div>

      {isPending ? (
        <Loading />
      ) : list.length === 0 ? (
        <p className="rounded-2xl bg-white/60 px-4 py-6 text-center font-serif text-sm text-black/40">
          Your shelf is empty. Add the things you like to spend time on, then tap
          one whenever you do it.
        </p>
      ) : (
        <section>
          <div className="flex items-center justify-between">
            <p className="font-heading text-sm uppercase text-olive">Your shelf</p>
            <div className="flex gap-1 rounded-full bg-black/5 p-0.5">
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSort(s.key)}
                  className={cn(
                    "rounded-full px-2.5 py-1 font-heading text-[10px] uppercase transition-colors",
                    sort === s.key ? "bg-white text-olive shadow-sm" : "text-black/45",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1 font-serif text-xs text-black/40">
            Tap a hobby to log that you did it.
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {list.map((h) => {
              const count = counts.get(h.id) ?? 0;
              return (
                <div
                  key={h.id}
                  className="group flex items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => onLog(h)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    aria-label={`Log ${h.name}`}
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sage/20 text-xl transition-colors group-hover:bg-sage/35">
                      {h.icon || "🌿"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-sm text-black">{h.name}</p>
                      <p className="truncate font-serif text-xs text-black/45">
                        {count === 0
                          ? "Not logged yet"
                          : `${count} ${count === 1 ? "time" : "times"}`}
                        {h.category ? ` · ${h.category}` : ""}
                      </p>
                    </div>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-olive/10 text-olive transition-colors group-hover:bg-olive group-hover:text-white">
                      <Plus className="size-4" strokeWidth={2.5} />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => remove.mutate(h.id)}
                    aria-label={`Delete ${h.name}`}
                    className="grid size-7 shrink-0 place-items-center rounded-full text-black/20 transition-colors hover:bg-black/5 hover:text-clay-deep"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/* -------------------------------- Log sheet ----------------------------- */

function LogModal({
  hobbies,
  initialHobbyId,
  prefillNote,
  onAddHobby,
  onClose,
}: {
  hobbies: Hobby[];
  initialHobbyId?: string | undefined;
  prefillNote?: string | undefined;
  onAddHobby: () => void;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [hobbyId, setHobbyId] = useState<string | null>(
    initialHobbyId ?? hobbies[0]?.id ?? null,
  );
  const [date, setDate] = useState(localToday());
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState(prefillNote ?? "");
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const selected = hobbies.find((h) => h.id === hobbyId);
  const mins = Math.max(0, Math.round(parseFloat(minutes.replace(/[^0-9.]/g, "")) || 0));
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);

  const save = useMutation({
    mutationFn: () =>
      addAwaLog({
        data: {
          ...(selected ? { hobbyId: selected.id } : {}),
          hobbyName: selected?.name ?? "Activity",
          ...(selected?.icon ? { hobbyIcon: selected.icon } : {}),
          minutes: mins,
          ...(note.trim() ? { note: note.trim() } : {}),
          loggedOn: date,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awa-logs"] });
      onClose();
    },
    onError: (e) =>
      setSaveErr(e instanceof Error ? e.message : "Couldn't save that activity."),
  });

  const canSave = !!selected && validDate && !save.isPending;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-6 shadow-xl [animation:rise_0.25s_both] sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl leading-none text-black">Log it</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black"
          >
            <X className="size-5" />
          </button>
        </div>

        {hobbies.length === 0 ? (
          <div className="mt-6 text-center">
            <p className="font-serif text-sm text-black/50">
              Add a hobby to your shelf first, then you can log it.
            </p>
            <button
              type="button"
              onClick={onAddHobby}
              className="mt-4 rounded-2xl bg-olive px-5 py-3 font-heading text-sm uppercase text-white transition-colors hover:bg-olive/90"
            >
              Go to shelf
            </button>
          </div>
        ) : (
          <>
            <p className="mt-6 font-heading text-sm uppercase text-olive">Hobby</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {hobbies.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setHobbyId(h.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-serif text-sm transition-colors",
                    hobbyId === h.id
                      ? "bg-olive text-white"
                      : "bg-white text-black/70 shadow-sm hover:bg-white/70",
                  )}
                >
                  <span>{h.icon || "🌿"}</span>
                  {h.name}
                </button>
              ))}
            </div>

            <p className="mt-6 font-heading text-sm uppercase text-olive">Date</p>
            <input
              type="date"
              value={date}
              max={localToday()}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 w-full rounded-2xl bg-black/5 px-4 py-3 font-serif text-base focus:outline-none focus:ring-1 focus:ring-olive/40"
            />

            <p className="mt-6 font-heading text-sm uppercase text-olive">
              Time <span className="text-black/35">(optional)</span>
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                inputMode="numeric"
                placeholder="Minutes"
                className="w-28 rounded-2xl bg-black/5 px-4 py-3 font-serif text-base placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
              />
              <span className="font-serif text-sm text-black/40">minutes</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[15, 30, 45, 60, 90].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMinutes(String(m))}
                  className="rounded-full bg-white px-3 py-1 font-mono text-xs text-black/60 shadow-sm transition-colors hover:bg-white/70"
                >
                  {fmtMins(m)}
                </button>
              ))}
            </div>

            <p className="mt-6 font-heading text-sm uppercase text-olive">
              Note <span className="text-black/35">(optional)</span>
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="What did you do?"
              className="mt-2 w-full resize-y rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm leading-relaxed placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
            />

            {saveErr && (
              <p className="mt-4 rounded-xl bg-clay-deep/10 px-3 py-2 font-serif text-sm text-clay-deep">
                {saveErr}
              </p>
            )}
            <button
              type="button"
              onClick={() => canSave && save.mutate()}
              disabled={!canSave}
              className="mt-6 w-full rounded-2xl bg-olive py-3.5 font-heading text-sm uppercase text-white shadow-sm transition-colors hover:bg-olive/90 disabled:opacity-40"
            >
              {save.isPending ? "Saving…" : "Save"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- Calendar ------------------------------ */

function CalendarTab() {
  const [offset, setOffset] = useState(0);
  const { data: logs, isPending } = useQuery(awaLogsQueryOptions);
  const [dayView, setDayView] = useState<string | null>(null);

  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const year = base.getFullYear();
  const month = base.getMonth(); // 0-11
  const monthKey = `${year}-${pad(month + 1)}`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon = 0
  const today = localToday();

  // Logs for this month, grouped by day-of-month.
  const byDay = useMemo(() => {
    const m = new Map<number, Log[]>();
    for (const l of (logs ?? []) as Log[]) {
      if (l.logged_on.slice(0, 7) !== monthKey) continue;
      const day = Number(l.logged_on.slice(8, 10));
      const arr = m.get(day) ?? [];
      arr.push(l);
      m.set(day, arr);
    }
    return m;
  }, [logs, monthKey]);

  const monthLogs = [...byDay.values()].flat();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-heading text-sm uppercase text-olive">
          {MONTHS[month]} {year}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setOffset((o) => o - 1)}
            className="grid size-8 place-items-center rounded-full bg-white shadow-sm transition-colors hover:bg-white/70"
          >
            <ChevronLeft className="size-4 text-olive" strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Next month"
            disabled={offset >= 0}
            onClick={() => setOffset((o) => o + 1)}
            className="grid size-8 place-items-center rounded-full bg-white shadow-sm transition-colors hover:bg-white/70 disabled:opacity-40"
          >
            <ChevronRight className="size-4 text-olive" strokeWidth={2} />
          </button>
        </div>
      </div>

      {isPending ? (
        <Loading />
      ) : (
        <>
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="grid grid-cols-7 gap-1">
              {WEEK_LABELS.map((l, i) => (
                <div
                  key={i}
                  className="pb-1 text-center font-serif text-[10px] text-black/35"
                >
                  {l}
                </div>
              ))}
              {Array.from({ length: firstDow }, (_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const date = `${monthKey}-${pad(day)}`;
                const dayLogs = byDay.get(day) ?? [];
                const isToday = date === today;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => dayLogs.length > 0 && setDayView(date)}
                    className={cn(
                      "flex aspect-square flex-col items-center rounded-lg p-1 transition-colors",
                      dayLogs.length > 0 ? "bg-sage/15 hover:bg-sage/25" : "",
                      isToday && "ring-1 ring-focus",
                    )}
                  >
                    <span
                      className={cn(
                        "font-mono text-[10px]",
                        isToday ? "text-focus" : "text-black/40",
                      )}
                    >
                      {day}
                    </span>
                    <div className="mt-0.5 flex flex-wrap justify-center gap-px leading-none">
                      {dayLogs.slice(0, 3).map((l, i) => (
                        <span key={i} className="text-[11px]">
                          {l.hobby_icon || "•"}
                        </span>
                      ))}
                      {dayLogs.length > 3 && (
                        <span className="text-[8px] text-black/40">
                          +{dayLogs.length - 3}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-center font-serif text-xs text-black/40">
            {monthLogs.length === 0
              ? "Nothing logged this month yet."
              : `${monthLogs.length} ${monthLogs.length === 1 ? "activity" : "activities"} this month. Tap a day to see what you did.`}
          </p>
        </>
      )}

      {dayView && (
        <DayModal date={dayView} logs={byDay.get(Number(dayView.slice(8, 10))) ?? []} onClose={() => setDayView(null)} />
      )}
    </div>
  );
}

function DayModal({
  date,
  logs,
  onClose,
}: {
  date: string;
  logs: Log[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: (id: string) => deleteAwaLog({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["awa-logs"] }),
  });
  const label = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-6 shadow-xl [animation:rise_0.25s_both] sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl leading-none text-black">{label}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {logs.map((l) => (
            <div
              key={l.id}
              className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sage/20 text-lg">
                {l.hobby_icon || "🌿"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-heading text-sm text-black">
                    {l.hobby_name}
                  </p>
                  {l.minutes > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-1 font-mono text-xs text-black/50">
                      <Clock className="size-3" /> {fmtMins(l.minutes)}
                    </span>
                  )}
                </div>
                {l.note && (
                  <p className="mt-0.5 font-serif text-sm italic text-black/55">
                    {l.note}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove.mutate(l.id)}
                aria-label="Delete log"
                className="grid size-7 shrink-0 place-items-center rounded-full text-black/25 transition-colors hover:bg-black/5 hover:text-clay-deep"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Want to do ----------------------------- */

function WantTab({ onLogItem }: { onLogItem: (title: string) => void }) {
  const queryClient = useQueryClient();
  const { data: wishlist, isPending } = useQuery(awaWishlistQueryOptions);
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["awa-wishlist"] });

  const [title, setTitle] = useState("");

  const add = useMutation({
    mutationFn: () => addAwaWishlistItem({ data: { title: title.trim() } }),
    onSuccess: () => {
      setTitle("");
      invalidate();
    },
  });
  const toggle = useMutation({
    mutationFn: (v: { id: string; done: boolean }) =>
      toggleAwaWishlistItem({ data: v }),
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
      <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && canAdd && add.mutate()}
          placeholder="Something you'd like to do…"
          maxLength={140}
          className="min-w-0 flex-1 bg-transparent px-1 font-serif text-sm placeholder:text-black/40 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => canAdd && add.mutate()}
          disabled={!canAdd}
          aria-label="Add to wishlist"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-olive text-white transition-colors hover:bg-olive/90 disabled:opacity-30"
        >
          <Plus className="size-4" strokeWidth={2.5} />
        </button>
      </div>

      {isPending ? (
        <Loading />
      ) : list.length === 0 ? (
        <p className="rounded-2xl bg-white/60 px-4 py-6 text-center font-serif text-sm text-black/40">
          Nothing on the list yet. Add things you'd love to try.
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
                aria-label={w.done ? "Mark not done" : "Mark done"}
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
                  w.done ? "text-black/40 line-through" : "text-black",
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
                  Log it
                </button>
              )}
              <button
                type="button"
                onClick={() => remove.mutate(w.id)}
                aria-label={`Delete ${w.title}`}
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
