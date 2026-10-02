import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Clock, Plus, X } from "lucide-react";
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
          "A calm hobby and activity tracker — log how you spend your free time and keep a wishlist of things to try.",
      },
    ],
  }),
  component: AwaPage,
});

type Hobby = { id: string; name: string; icon: string | null; category: string | null };
type Log = {
  id: string;
  hobby_name: string;
  hobby_icon: string | null;
  minutes: number;
  note: string | null;
  logged_on: string;
};
type Wish = { id: string; title: string; done: boolean };

type Tab = "today" | "hobbies" | "want" | "history";
const TABS: { key: Tab; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "hobbies", label: "Hobbies" },
  { key: "want", label: "Want to do" },
  { key: "history", label: "History" },
];

function fmtMins(mins: number): string {
  if (mins <= 0) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return [h ? `${h}h` : "", m ? `${m}m` : ""].filter(Boolean).join(" ") || "0m";
}

function AwaPage() {
  const [tab, setTab] = useState<Tab>("today");
  // Opening the log sheet, optionally prefilled from a wishlist item.
  const [logPrefill, setLogPrefill] = useState<{ note?: string } | null>(null);

  const { data: hobbies } = useQuery(awaHobbiesQueryOptions);

  return (
    <AppShell title="A While Away" hideSettings>
      <div className="mt-2 pb-4">
        <p className="font-serif text-sm italic text-black/45">
          Time outside of work and everyday things — enjoyed, not optimised.
        </p>

        {/* Internal tabs */}
        <div className="mt-4 flex gap-1.5 overflow-x-auto rounded-full bg-black/5 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-1.5 font-heading text-[11px] uppercase tracking-wide transition-colors",
                tab === t.key ? "bg-white text-olive shadow-sm" : "text-black/45",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "today" && <TodayTab onLog={() => setLogPrefill({})} />}
          {tab === "hobbies" && <HobbiesTab />}
          {tab === "want" && (
            <WantTab onLogItem={(title) => setLogPrefill({ note: title })} />
          )}
          {tab === "history" && <HistoryTab />}
        </div>
      </div>

      {logPrefill && (
        <LogModal
          hobbies={(hobbies ?? []) as Hobby[]}
          prefillNote={logPrefill.note}
          onAddHobby={() => {
            setLogPrefill(null);
            setTab("hobbies");
          }}
          onClose={() => setLogPrefill(null)}
        />
      )}
    </AppShell>
  );
}

/* --------------------------------- Today -------------------------------- */

function TodayTab({ onLog }: { onLog: () => void }) {
  const today = localToday();
  const { data: logs, isPending } = useQuery(awaLogsQueryOptions);

  const todayLogs = ((logs ?? []) as Log[]).filter((l) => l.logged_on === today);
  const total = todayLogs.reduce((s, l) => s + l.minutes, 0);

  const dateLabel = new Date(`${today}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
        <p className="font-heading text-[11px] uppercase tracking-wide text-black/40">
          {dateLabel}
        </p>
        <p className="mt-3 font-display text-2xl leading-tight text-black">
          What did you do a while away today?
        </p>
        <button
          type="button"
          onClick={onLog}
          className="mt-5 inline-flex items-center gap-1.5 rounded-2xl bg-olive px-5 py-3 font-heading text-sm uppercase text-white transition-colors hover:bg-olive/90"
        >
          <Plus className="size-4" strokeWidth={2} />
          Log an activity
        </button>
      </div>

      {isPending ? (
        <Loading />
      ) : todayLogs.length === 0 ? (
        <p className="rounded-2xl bg-white/60 px-4 py-6 text-center font-serif text-sm text-black/40">
          Nothing logged yet today. Whenever you spend a while away, pop it in.
        </p>
      ) : (
        <section>
          <div className="flex items-center justify-between">
            <p className="font-heading text-sm uppercase text-olive">Today</p>
            <span className="inline-flex items-center gap-1 font-mono text-xs text-black/50">
              <Clock className="size-3.5" /> {fmtMins(total)}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {todayLogs.map((l) => (
              <LogRow key={l.id} log={l} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function LogRow({ log }: { log: Log }) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: () => deleteAwaLog({ data: { id: log.id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["awa-logs"] }),
  });
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sage/20 text-lg">
        {log.hobby_icon || "🌿"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-heading text-sm text-black">{log.hobby_name}</p>
          <span className="shrink-0 font-mono text-xs text-black/50">
            {fmtMins(log.minutes)}
          </span>
        </div>
        {log.note && (
          <p className="mt-0.5 font-serif text-sm italic text-black/55">{log.note}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => remove.mutate()}
        aria-label="Delete log"
        className="grid size-7 shrink-0 place-items-center rounded-full text-black/25 transition-colors hover:bg-black/5 hover:text-clay-deep"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

/* --------------------------------- Log modal ---------------------------- */

function LogModal({
  hobbies,
  prefillNote,
  onAddHobby,
  onClose,
}: {
  hobbies: Hobby[];
  prefillNote?: string | undefined;
  onAddHobby: () => void;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [hobbyId, setHobbyId] = useState<string | null>(hobbies[0]?.id ?? null);
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState(prefillNote ?? "");
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const selected = hobbies.find((h) => h.id === hobbyId);
  const mins = Math.max(0, Math.round(parseFloat(minutes.replace(/[^0-9.]/g, "")) || 0));

  const save = useMutation({
    mutationFn: () =>
      addAwaLog({
        data: {
          ...(selected ? { hobbyId: selected.id } : {}),
          hobbyName: selected?.name ?? "Activity",
          ...(selected?.icon ? { hobbyIcon: selected.icon } : {}),
          minutes: mins,
          ...(note.trim() ? { note: note.trim() } : {}),
          loggedOn: localToday(),
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awa-logs"] });
      onClose();
    },
    onError: (e) =>
      setSaveErr(e instanceof Error ? e.message : "Couldn't save that activity."),
  });

  const canSave = !!selected && mins > 0 && !save.isPending;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-6 shadow-xl [animation:rise_0.25s_both] sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl leading-none text-black">Log an activity</h2>
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
              Add a hobby first, then you can log time against it.
            </p>
            <button
              type="button"
              onClick={onAddHobby}
              className="mt-4 rounded-2xl bg-olive px-5 py-3 font-heading text-sm uppercase text-white transition-colors hover:bg-olive/90"
            >
              Add a hobby
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

            <p className="mt-6 font-heading text-sm uppercase text-olive">Time spent</p>
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

            <p className="mt-6 font-heading text-sm uppercase text-olive">Note</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="How was it? (optional)"
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
              {save.isPending ? "Saving…" : "Save activity"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- Hobbies ------------------------------- */

function HobbiesTab() {
  const queryClient = useQueryClient();
  const { data: hobbies, isPending } = useQuery(awaHobbiesQueryOptions);
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["awa-hobbies"] });

  const [icon, setIcon] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [err, setErr] = useState<string | null>(null);

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

  const list = (hobbies ?? []) as Hobby[];
  const canAdd = name.trim().length > 0 && !add.isPending;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="font-heading text-sm uppercase text-olive">New hobby</p>
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
          No hobbies yet. Add the things you like to spend time on.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {list.map((h) => (
            <div
              key={h.id}
              className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sage/20 text-xl">
                {h.icon || "🌿"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-sm text-black">{h.name}</p>
                {h.category && (
                  <p className="truncate font-serif text-xs text-black/45">
                    {h.category}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove.mutate(h.id)}
                aria-label={`Delete ${h.name}`}
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

/* -------------------------------- History ------------------------------- */

function HistoryTab() {
  const { data: logs, isPending } = useQuery(awaLogsQueryOptions);
  const list = (logs ?? []) as Log[];
  const month = localToday().slice(0, 7);

  const monthLogs = list.filter((l) => l.logged_on.slice(0, 7) === month);
  const monthTotal = monthLogs.reduce((s, l) => s + l.minutes, 0);
  const perHobby = new Map<string, number>();
  for (const l of monthLogs) {
    perHobby.set(l.hobby_name, (perHobby.get(l.hobby_name) ?? 0) + l.minutes);
  }
  const perHobbyList = [...perHobby.entries()].sort((a, b) => b[1] - a[1]);

  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  // Group all logs by day for the timeline.
  const byDay = new Map<string, Log[]>();
  for (const l of list) {
    const arr = byDay.get(l.logged_on) ?? [];
    arr.push(l);
    byDay.set(l.logged_on, arr);
  }
  const days = [...byDay.keys()].sort((a, b) => (a < b ? 1 : -1));

  if (isPending) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Monthly summary */}
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="font-heading text-sm uppercase text-olive">{monthLabel}</p>
        <div className="mt-3 flex gap-6">
          <div>
            <p className="font-heading text-2xl leading-none text-black">
              {fmtMins(monthTotal)}
            </p>
            <p className="mt-1 font-serif text-xs text-black/45">time away</p>
          </div>
          <div>
            <p className="font-heading text-2xl leading-none text-black">
              {monthLogs.length}
            </p>
            <p className="mt-1 font-serif text-xs text-black/45">
              {monthLogs.length === 1 ? "activity" : "activities"}
            </p>
          </div>
        </div>
        {perHobbyList.length > 0 && (
          <div className="mt-4 space-y-2">
            {perHobbyList.map(([hobby, mins]) => (
              <div key={hobby} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate font-serif text-sm text-black/70">
                  {hobby}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5">
                  <div
                    className="h-full rounded-full bg-sage"
                    style={{
                      width: `${monthTotal ? Math.round((mins / monthTotal) * 100) : 0}%`,
                    }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right font-mono text-xs text-black/50">
                  {fmtMins(mins)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      {days.length === 0 ? (
        <p className="rounded-2xl bg-white/60 px-4 py-6 text-center font-serif text-sm text-black/40">
          Your logged activities will appear here.
        </p>
      ) : (
        days.map((day) => (
          <section key={day}>
            <p className="font-heading text-xs uppercase tracking-wide text-black/40">
              {new Date(`${day}T00:00:00`).toLocaleDateString(undefined, {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </p>
            <div className="mt-2 space-y-2">
              {byDay.get(day)!.map((l) => (
                <LogRow key={l.id} log={l} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
