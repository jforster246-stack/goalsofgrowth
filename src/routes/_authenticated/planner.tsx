import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Star, Trash2, X, Check, Timer, MapPin, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell";
import { localToday } from "@/components/goal-ui";
import { mondayWeek } from "@/lib/week-dates";
import {
  addPlannerItems,
  deletePlannerItem,
  getPlannerResetDraft,
  getPlannerWeek,
  savePlannerResetDraft,
  clearPlannerResetDraft,
  savePlannerWeek,
  updatePlannerItem,
  type Slot,
} from "@/lib/planner.functions";
import { createWin } from "@/lib/wins.functions";
import { cn } from "@/lib/utils";
import { createDraftQueue, LEGACY_RESET_KEY, resetCacheKey, resetDraftSchema, type ResetDraft } from "@/lib/planner-reset-draft";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "Weekly planner - Moongrove" },
      { name: "description", content: "Plan your week with a guided weekly reset: audit, wins, calendar, AWA, dinners and more." },
      { property: "og:title", content: "Weekly planner - Moongrove" },
      { property: "og:description", content: "A guided weekly reset that fills out your planner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlannerPage,
});

const DAY_SLOTS: { slot: Slot; label: string; short: string }[] = [
  { slot: "morning", label: "Morning", short: "Morning" },
  { slot: "midday", label: "Midday", short: "Midday" },
  { slot: "lunch", label: "Lunch", short: "Lunch" },
  { slot: "awa", label: "AWA · After work activity", short: "AWA" },
  { slot: "evening", label: "Evening", short: "Evening" },
  { slot: "dinner", label: "Dinner", short: "Dinner" },
];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function shiftWeek(start: string, weeks: number) {
  const [y, m, d] = start.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + weeks * 7)).toISOString().slice(0, 10);
}
function slotForTime(time: string): Slot {
  const h = Number(time.split(":")[0]);
  if (!time || Number.isNaN(h)) return "morning";
  return h < 12 ? "morning" : h < 17 ? "midday" : "evening";
}

const weekQuery = (start: string) => ({
  queryKey: ["planner", start],
  queryFn: () => getPlannerWeek({ data: { start, end: shiftWeek(start, 1) } }),
});

function PlannerPage() {
  const thisWeek = mondayWeek(localToday())[0] ?? localToday();
  const [start, setStart] = useState(thisWeek);
  const [resetOpen, setResetOpen] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [resetDraft, setResetDraft] = useState<ResetDraft | null>(null);
  const [resetUserId, setResetUserId] = useState("");
  const [openingReset, setOpeningReset] = useState(false);
  const [resetLoadError, setResetLoadError] = useState(false);
  const loadAccountDraft = useServerFn(getPlannerResetDraft);
  const accountDraft = useQuery({ queryKey: ["planner-reset-draft"], queryFn: () => loadAccountDraft() });
  useEffect(() => {
    if (accountDraft.data) setDraftSaved(Boolean(loadDraft(accountDraft.data.userId, accountDraft.data.draft)));
  }, [accountDraft.data, resetOpen]);
  const days = mondayWeek(start);
  const qc = useQueryClient();
  const { data } = useQuery(weekQuery(start));
  const items = (data?.items ?? []).filter((i) => i.day <= (days[6] ?? start));
  const refresh = () => qc.invalidateQueries({ queryKey: ["planner"] });
  const toggle = useMutation({ mutationFn: (v: { id: string; done: boolean }) => updatePlannerItem({ data: v }), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (id: string) => deletePlannerItem({ data: { id } }), onSuccess: refresh });
  const add = useMutation({ mutationFn: (v: { day: string; slot: Slot; title: string }) => addPlannerItems({ data: [v] }), onSuccess: refresh });
  const openReset = async () => {
    setOpeningReset(true);
    setResetLoadError(false);
    try {
      const result = await loadAccountDraft();
      setResetUserId(result.userId);
      setResetDraft(loadDraft(result.userId, result.draft));
      setResetOpen(true);
    } catch {
      setResetLoadError(true);
    } finally {
      setOpeningReset(false);
    }
  };
  const closeReset = () => {
    setResetOpen(false);
    void qc.invalidateQueries({ queryKey: ["planner-reset-draft"] });
  };

  return (
    <AppShell title="Planner">
      <div className="mt-2 flex w-full min-w-0 flex-col pb-24 lg:min-h-0 lg:flex-1 lg:pb-0">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button aria-label="Previous week" className="rounded-full p-2 hover:bg-muted" onClick={() => setStart(shiftWeek(start, -1))}><ChevronLeft className="size-5" /></button>
            <button aria-label="Next week" className="rounded-full p-2 hover:bg-muted" onClick={() => setStart(shiftWeek(start, 1))}><ChevronRight className="size-5" /></button>
            {start !== thisWeek && <button className="ml-1 text-xs text-muted-foreground underline" onClick={() => setStart(thisWeek)}>This week</button>}
          </div>
          <Button disabled={openingReset} onClick={openReset} className="rounded-full">
            {openingReset ? "Loading your progress…" : draftSaved ? "Continue weekly reset" : data?.week?.completed_at ? "Redo weekly reset" : "Start weekly reset"}
          </Button>
        </div>
        {resetLoadError && <p role="alert" className="mt-2 text-sm text-destructive">Your saved reset couldn’t be loaded. Please try again.</p>}

        <div className="mt-4 grid min-h-0 flex-1 grid-cols-1 border-y border-border bg-card md:grid-cols-2 lg:grid-cols-7 lg:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.6fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.6fr)]">
          {days.map((day, i) => {
            const dayItems = items.filter((it) => it.day === day);
            const allDay = dayItems.filter((it) => it.slot === "allday");
            return (
              <section key={day} aria-label={DAY_NAMES[i]} className="min-w-0 border-b border-border md:border-r lg:row-span-7 lg:grid lg:grid-rows-subgrid lg:border-b-0 lg:last:border-r-0">
                <div className={cn("min-w-0 border-b border-border px-2 py-2", day === localToday() && "bg-primary/10")}>
                <p className={cn("break-words font-heading text-xs xl:text-sm", day === localToday() ? "text-primary" : "text-foreground")}>{DAY_NAMES[i]}</p>
                {allDay.map((it) => (
                  <div key={it.id} className="mt-2 flex items-center gap-2 rounded-lg bg-primary/10 px-2 py-1.5 text-sm">
                    <span className="min-w-0 break-words font-semibold">{it.title}</span>
                    {it.location && <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><MapPin className="size-3" />{it.location}</span>}
                    <button aria-label="Remove" className="ml-auto text-muted-foreground" onClick={() => remove.mutate(it.id)}><X className="size-3.5" /></button>
                  </div>
                ))}
                </div>
                {DAY_SLOTS.map(({ slot, label, short }) => (
                  <SlotBlock key={slot} label={label} short={short} slot={slot}
                    hobbies={data?.hobbies ?? []}
                    items={dayItems.filter((it) => it.slot === slot)}
                    onAdd={(title) => add.mutate({ day, slot, title })}
                    onToggle={(id, done) => toggle.mutate({ id, done })}
                    onRemove={(id) => remove.mutate(id)} />
                ))}
              </section>
            );
          })}
        </div>
      </div>
      {resetOpen && (
        <WeeklyReset
          defaultWeek={shiftWeek(thisWeek, 1)}
          thisWeek={thisWeek}
          hobbies={data?.hobbies ?? []}
          initialDraft={resetDraft}
          userId={resetUserId}
          onClose={closeReset}
          onDone={(w) => { closeReset(); setStart(w); refresh(); }}
        />
      )}
    </AppShell>
  );
}

type Item = { id: string; title: string; time: string | null; done: boolean; location: string | null };
type PlannerHobby = { id: string; name: string };
function HobbyTags({ hobbies, onSelect }: { hobbies: PlannerHobby[]; onSelect: (hobby: PlannerHobby) => void }) {
  return hobbies.length ? (
    <div className="flex flex-wrap gap-1.5" aria-label="Choose a hobby">
      {hobbies.map((hobby) => <Button key={hobby.id} variant="secondary" size="sm" className="h-auto min-h-8 max-w-full whitespace-normal break-words rounded-full bg-sage/20 text-foreground hover:bg-sage/30" onClick={() => onSelect(hobby)}>{hobby.name}</Button>)}
    </div>
  ) : <p className="text-xs text-muted-foreground">No hobbies yet. Add one in A While Away.</p>;
}
function SlotBlock({ label, short, slot, items, hobbies, onAdd, onToggle, onRemove }: {
  label: string; short: string; slot: Slot; items: Item[]; hobbies: PlannerHobby[]; onAdd: (t: string) => void; onToggle: (id: string, d: boolean) => void; onRemove: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const meal = slot === "lunch" || slot === "dinner";
  return (
    <div className={cn("min-w-0 border-b border-border px-2 py-2 last:border-b-0 [scrollbar-width:none] lg:min-h-0 lg:overflow-y-auto [&::-webkit-scrollbar]:hidden xl:px-3", meal ? "min-h-[4.8rem]" : "min-h-[9.6rem]", slot === "awa" && "bg-sage/5")}>
      <div className="flex items-start justify-between gap-1">
        <p className="min-w-0 break-words pt-1 font-body text-xs text-muted-foreground">
          <span className="hidden xl:inline">{label}</span>
          <span className="xl:hidden">{short}</span>
        </p>
        <Button variant="ghost" size="icon" aria-label={`Add to ${label}`} className="size-6 shrink-0 text-muted-foreground" onClick={() => setAdding((a) => !a)}><Plus /></Button>
      </div>
      {items.map((it) => (
        <div key={it.id} className="group mt-1 flex items-start gap-2 text-sm">
          {!meal && (
            <Button variant="outline" size="icon" aria-label={it.done ? "Mark not done" : "Mark done"} onClick={() => onToggle(it.id, !it.done)}
              className={cn("mt-0.5 size-5 shrink-0 p-0", it.done && "bg-primary text-primary-foreground")}>
              {it.done && <Check className="size-3" />}
            </Button>
          )}
          <span className={cn("min-w-0 flex-1 break-words", slot === "awa" && "rounded-full bg-sage/20 px-2 py-1 text-xs", it.done && "text-muted-foreground line-through")}>
            {it.time && <span className="mr-1 text-xs text-muted-foreground">{it.time}</span>}{it.title}
          </span>
          <Button variant="ghost" size="icon" aria-label="Remove" className="size-5 shrink-0 text-muted-foreground opacity-60 hover:opacity-100" onClick={() => onRemove(it.id)}><Trash2 /></Button>
        </div>
      ))}
      {adding && slot === "awa" && <div className="mt-2"><HobbyTags hobbies={hobbies} onSelect={(hobby) => { onAdd(hobby.name); setAdding(false); }} /></div>}
      {adding && slot !== "awa" && (
        <form className="mt-1 flex gap-1" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onAdd(text.trim()); setText(""); setAdding(false); } }}>
          <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Add…" className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm" />
          <Button size="sm" className="px-2" type="submit">Add</Button>
        </form>
      )}
    </div>
  );
}

/* ---------------- Weekly reset wizard ---------------- */

const AUDIT: { id: string; title: string; parts: string[] }[] = [
  { id: "body", title: "Your body", parts: ["Physical health", "Fitness", "The way you look"] },
  { id: "path", title: "Your path", parts: ["Career", "Education", "Purposeful life"] },
  { id: "money", title: "Your money", parts: ["Money"] },
  { id: "people", title: "Your people", parts: ["Platonic relationships", "Non-platonic relationships", "Family"] },
  { id: "peace", title: "Your peace", parts: ["Mental health", "Mindset"] },
];

type NewItem = { day: string; slot: Slot; title: string; time?: string; location?: string };

function Stars({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-sm">{label}</span>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-label={`${label}: ${n} stars`} onClick={() => onChange(n === value ? 0 : n)} className="p-0.5">
            <Star className={cn("size-6", n <= value ? "fill-gold text-gold" : "text-muted-foreground/40")} />
          </button>
        ))}
      </div>
    </div>
  );
}

function CountdownTimer({ minutes }: { minutes: number }) {
  const [left, setLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((l) => (l <= 1 ? (setRunning(false), 0) : l - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl bg-muted/50 p-5">
      <p className="font-heading text-5xl tabular-nums">{mm}:{ss}</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => setRunning((r) => !r)} className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
          <Timer className="size-4" />{running ? "Pause" : left === 0 ? "Done!" : `Start ${minutes} min`}
        </button>
        <button type="button" onClick={() => { setRunning(false); setLeft(minutes * 60); }} className="rounded-full px-3 py-2 text-sm text-muted-foreground">Reset</button>
      </div>
    </div>
  );
}

const input = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";

function DayPick({ days, value, onChange }: { days: string[]; value: string; onChange: (d: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {days.map((d, i) => (
        <button key={d} type="button" onClick={() => onChange(d)}
          className={cn("rounded-full px-3 py-1 text-xs ring-1 ring-border", value === d ? "bg-primary text-primary-foreground" : "bg-background")}>
          {DAY_NAMES[i]?.slice(0, 3)}
        </button>
      ))}
    </div>
  );
}

function loadDraft(userId: string, account: ResetDraft | null): ResetDraft | null {
  try {
    // Only unsynced answers are cached. Synced progress always comes from the account.
    const pending = localStorage.getItem(resetCacheKey(userId));
    if (pending) {
      const parsed = resetDraftSchema.safeParse(JSON.parse(pending));
      if (parsed.success) return parsed.data;
    }
    if (account) return account;
    const legacy = localStorage.getItem(LEGACY_RESET_KEY);
    if (legacy) {
      const parsed = resetDraftSchema.safeParse(JSON.parse(legacy));
      if (parsed.success) {
        localStorage.setItem(resetCacheKey(userId), JSON.stringify(parsed.data));
        localStorage.removeItem(LEGACY_RESET_KEY);
        return parsed.data;
      }
    }
  } catch { /* Account progress still works when device storage is unavailable. */ }
  return account;
}

function WeeklyReset({ defaultWeek, thisWeek, hobbies, initialDraft: draft, userId, onClose, onDone }: {
  defaultWeek: string; thisWeek: string; hobbies: { id: string; name: string }[]; initialDraft: ResetDraft | null; userId: string; onClose: () => void; onDone: (w: string) => void;
}) {
  const d = <T,>(k: keyof ResetDraft, fallback: T): T => (draft?.[k] === undefined ? fallback : draft[k] as T);
  const [step, setStep] = useState(() => d("step", 0));
  const [week, setWeek] = useState(() => d("week", defaultWeek));
  const days = mondayWeek(week);
  const [audit, setAudit] = useState<Record<string, number>>(() => d("audit", {}));
  const [wins, setWins] = useState<string[]>(() => d("wins", []));
  const [winText, setWinText] = useState(() => d("winText", ""));
  const [events, setEvents] = useState<NewItem[]>(() => d("events", []));
  const [ev, setEv] = useState(() => d("ev", { day: days[0] ?? week, time: "", title: "" }));
  const [ooo, setOoo] = useState<NewItem[]>(() => d("ooo", []));
  const [oooForm, setOooForm] = useState(() => d("oooForm", { day: days[0] ?? week, location: "" }));
  const [awa, setAwa] = useState<NewItem[]>(() => d("awa", []));
  const [awaDay, setAwaDay] = useState(() => d("awaDay", days[0] ?? week));
  const [myself, setMyself] = useState(() => d("myself", { text: "", day: days[5] ?? week }));
  const [reflect, setReflect] = useState(() => d("reflect", { habits: "", routines: "" }));
  const [dinners, setDinners] = useState<string[]>(() => d("dinners", Array(7).fill("")));

  const [draftError, setDraftError] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const [enqueue] = useState(createDraftQueue);
  const stopped = useRef(false);
  const latest = useRef("");
  const saveAccountDraft = useServerFn(savePlannerResetDraft);
  const clearAccountDraft = useServerFn(clearPlannerResetDraft);
  const snapshot = JSON.stringify({ step, week, audit, wins, winText, events, ev, ooo, oooForm, awa, awaDay, myself, reflect, dinners });
  const persistDraft = useCallback(async () => {
    if (stopped.current) return false;
    try { localStorage.setItem(resetCacheKey(userId), snapshot); } catch { /* Cloud saving doesn't require device storage. */ }
    try {
      await enqueue(() => saveAccountDraft({ data: resetDraftSchema.parse(JSON.parse(snapshot)) }));
      if (latest.current === snapshot) {
        try { localStorage.removeItem(resetCacheKey(userId)); } catch { /* ignore */ }
        setDraftError(false);
        setSyncing(false);
      }
      return true;
    } catch {
      if (latest.current === snapshot) { setDraftError(true); setSyncing(false); }
      return false;
    }
  }, [snapshot, userId, enqueue, saveAccountDraft]);
  // Cache unfinished input immediately, then save it to the account after typing settles.
  useEffect(() => {
    if (stopped.current) return;
    latest.current = snapshot;
    setSyncing(true);
    setDraftError(false);
    try { localStorage.setItem(resetCacheKey(userId), snapshot); } catch { /* ignore */ }
    const timer = setTimeout(() => { void persistDraft(); }, 400);
    const flush = () => { if (!stopped.current) void persistDraft(); };
    window.addEventListener("pagehide", flush);
    window.addEventListener("blur", flush);
    return () => { clearTimeout(timer); window.removeEventListener("pagehide", flush); window.removeEventListener("blur", flush); };
  }, [snapshot, userId, persistDraft]);
  const saveAndClose = async () => {
    setSaving(true);
    if (await persistDraft()) onClose();
    else setSaving(false);
  };
  const clearDraft = async () => {
    stopped.current = true;
    await enqueue(() => clearAccountDraft());
    try { localStorage.removeItem(resetCacheKey(userId)); } catch { /* ignore */ }
  };
  const startOver = async () => {
    if (!confirm("Start the weekly reset over? Your saved answers will be cleared.")) return;
    setSaving(true);
    try { await clearDraft(); onClose(); }
    catch { stopped.current = false; setDraftError(true); setSaving(false); }
  };
  const firstWeek = useRef(true);
  const [saving, setSaving] = useState(false);

  // Keep day pickers inside the chosen week.
  useEffect(() => {
    if (firstWeek.current) { firstWeek.current = false; return; }
    setEv((e) => ({ ...e, day: days[0] ?? week }));
    setOooForm((o) => ({ ...o, day: days[0] ?? week }));
    setAwaDay(days[0] ?? week);
    setMyself((m) => ({ ...m, day: days[5] ?? week }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week]);

  const finish = async () => {
    setSaving(true);
    try {
      const all: NewItem[] = [
        ...ooo, ...events, ...awa,
        ...(myself.text.trim() ? [{ day: myself.day, slot: "evening" as Slot, title: `For me: ${myself.text.trim()}` }] : []),
        ...dinners.flatMap((d, i) => (d.trim() ? [{ day: days[i] ?? week, slot: "dinner" as Slot, title: d.trim() }] : [])),
      ].map((i) => ({ ...i, day: i.day }));
      await addPlannerItems({ data: all });
      for (const w of wins) await createWin({ data: { title: w.slice(0, 140), kind: "achievement" } });
      await savePlannerWeek({ data: { weekStart: week, audit, reflections: { ...reflect, myself: myself.text } } });
      await clearDraft();
      onDone(week);
    } catch {
      stopped.current = false;
      setDraftError(true);
    } finally {
      setSaving(false);
    }
  };

  const steps: { title: string; body: React.ReactNode; skippable?: boolean }[] = [
    {
      title: "Weekly audit",
      body: (
        <>
          <div className="mb-4 flex gap-2">
            {[{ w: thisWeek, l: "This week" }, { w: shiftWeek(thisWeek, 1), l: "Next week" }].map(({ w, l }) => (
              <button key={w} onClick={() => setWeek(w)} className={cn("rounded-full px-3 py-1 text-xs ring-1 ring-border", week === w && "bg-primary text-primary-foreground")}>
                {l}
              </button>
            ))}
          </div>
          {AUDIT.map((a) => (
            <div key={a.id} className="mb-3">
              <p className="font-heading text-sm text-foreground">{a.title}</p>
              {a.parts.map((p) => {
                const k = `${a.id}.${p}`;
                return <Stars key={k} label={p} value={audit[k] ?? 0} onChange={(n) => setAudit({ ...audit, [k]: n })} />;
              })}
            </div>
          ))}
        </>
      ),
    },
    {
      title: "Add your wins",
      body: (
        <>
          <p className="text-sm text-muted-foreground">Add as many as you like. They'll be saved to your wins.</p>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (winText.trim()) { setWins([...wins, winText.trim()]); setWinText(""); } }}>
            <input value={winText} onChange={(e) => setWinText(e.target.value)} placeholder="A win this week…" className={input} />
            <button className="rounded-lg bg-primary px-3 text-sm text-primary-foreground">Add</button>
          </form>
          <ul className="mt-3 space-y-1">
            {wins.map((w, i) => (
              <li key={i} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <Star className="size-4 fill-gold text-gold" />{w}
                <button aria-label="Remove win" className="ml-auto" onClick={() => setWins(wins.filter((_, j) => j !== i))}><X className="size-4" /></button>
              </li>
            ))}
          </ul>
        </>
      ),
    },
    {
      title: "Distraction list",
      skippable: true,
      body: (<><p className="text-sm">Check your distraction list and pick two things that you can do right now.</p><CountdownTimer minutes={20} /></>),
    },
    {
      title: "Schedule calendar items",
      body: (
        <>
          <p className="text-sm text-muted-foreground">Go through your calendar and add anything happening this week.</p>
          <div className="mt-3 space-y-2">
            <DayPick days={days} value={ev.day} onChange={(d) => setEv({ ...ev, day: d })} />
            <div className="flex gap-2">
              <input type="time" value={ev.time} onChange={(e) => setEv({ ...ev, time: e.target.value })} className={cn(input, "w-32")} />
              <input value={ev.title} onChange={(e) => setEv({ ...ev, title: e.target.value })} placeholder="Event" className={input} />
            </div>
            <button className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={() => {
              if (!ev.title.trim()) return;
              setEvents([...events, { day: ev.day, slot: slotForTime(ev.time), title: ev.title.trim(), ...(ev.time ? { time: ev.time } : {}) }]);
              setEv({ ...ev, title: "", time: "" });
            }}>Add event</button>
          </div>
          <ItemList items={events} onRemove={(i) => setEvents(events.filter((_, j) => j !== i))} days={days} />
        </>
      ),
    },
    {
      title: "Work out-of-office day",
      skippable: true,
      body: (
        <>
          <p className="text-sm text-muted-foreground">Pick the day and where you'll be. It's scheduled all day.</p>
          <div className="mt-3 space-y-2">
            <DayPick days={days} value={oooForm.day} onChange={(d) => setOooForm({ ...oooForm, day: d })} />
            <input value={oooForm.location} onChange={(e) => setOooForm({ ...oooForm, location: e.target.value })} placeholder="Location" className={input} />
            <button className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={() => {
              setOoo([...ooo, { day: oooForm.day, slot: "allday", title: "Out of office", ...(oooForm.location.trim() ? { location: oooForm.location.trim() } : {}) }]);
              setOooForm({ ...oooForm, location: "" });
            }}>Add day</button>
          </div>
          <ItemList items={ooo} onRemove={(i) => setOoo(ooo.filter((_, j) => j !== i))} days={days} />
        </>
      ),
    },
    {
      title: "After work activities (AWA)",
      body: (
        <>
          <p className="text-sm text-muted-foreground">Look at your monthly Notion page and brain dump. What hands-on things do you want to do, and when?</p>
          <div className="mt-3 space-y-3">
            <DayPick days={days} value={awaDay} onChange={setAwaDay} />
            <HobbyTags hobbies={hobbies} onSelect={(hobby) => setAwa([...awa, { day: awaDay, slot: "awa", title: hobby.name }])} />
          </div>
          <ItemList items={awa} onRemove={(i) => setAwa(awa.filter((_, j) => j !== i))} days={days} />
        </>
      ),
    },
    {
      title: "Am I doing something for myself this week?",
      body: (
        <>
          <p className="text-sm text-muted-foreground">Check your hobbies and projects.</p>
          <label className="mt-3 block text-sm">What can I schedule for myself this week?</label>
          <textarea value={myself.text} onChange={(e) => setMyself({ ...myself, text: e.target.value })} rows={3} className={cn(input, "mt-1")} />
          <div className="mt-2"><DayPick days={days} value={myself.day} onChange={(d) => setMyself({ ...myself, day: d })} /></div>
        </>
      ),
    },
    {
      title: "Reflect on your habits",
      body: (<><p className="text-sm text-muted-foreground">Are your habits working? Is there anything you could change?</p>
        <textarea value={reflect.habits} onChange={(e) => setReflect({ ...reflect, habits: e.target.value })} rows={4} className={cn(input, "mt-3")} /></>),
    },
    {
      title: "Reflect on your routines",
      body: (<><p className="text-sm text-muted-foreground">Is there anything you could change in your routines?</p>
        <textarea value={reflect.routines} onChange={(e) => setReflect({ ...reflect, routines: e.target.value })} rows={4} className={cn(input, "mt-3")} /></>),
    },
    {
      title: "Plan dinners",
      body: (
        <>
          <p className="text-sm text-muted-foreground">Use your menu folder to plan each night.</p>
          <div className="mt-3 space-y-2">
            {days.map((d, i) => (
              <div key={d} className="flex items-center gap-2">
                <span className="w-12 text-xs font-semibold">{DAY_NAMES[i]?.slice(0, 3)}</span>
                <input value={dinners[i]} onChange={(e) => setDinners(dinners.map((x, j) => (j === i ? e.target.value : x)))} placeholder="Dinner" className={input} />
              </div>
            ))}
          </div>
        </>
      ),
    },
    {
      title: "Build your grocery list",
      skippable: true,
      body: (<><p className="text-sm">Build your grocery list for the week.</p><CountdownTimer minutes={15} /></>),
    },
    {
      title: "Set the mood",
      body: <p className="text-sm">Swap your phone case and wallpaper to match how you want to feel this week.</p>,
    },
  ];
  const s = steps[step];
  if (!s) return null;
  const last = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 sm:items-center" role="dialog" aria-modal="true">
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl bg-card shadow-xl sm:rounded-3xl">
        <div className="flex items-center justify-between px-5 pt-5">
          <p className="text-xs text-muted-foreground">Weekly reset · {step + 1} of {steps.length} · <span className="italic" role="status">{draftError ? "not saved to account" : syncing ? "saving…" : "saved to account"}</span></p>
          <Button variant="ghost" size="icon" aria-label="Save and close" disabled={saving} onClick={saveAndClose}><X className="size-5" /></Button>
        </div>
        <div className="mx-5 mt-2 h-1 rounded-full bg-muted"><div className="h-1 rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
        <div className="overflow-y-auto px-5 py-4">
          <h2 className="mb-3 font-heading text-xl text-foreground">{s.title}</h2>
          <fieldset disabled={saving}>{s.body}</fieldset>
          {draftError && <p role="alert" className="mt-3 text-sm text-destructive">Your progress couldn’t be saved to your account. Keep this window open, check your connection and try Save &amp; close again.</p>}
        </div>
        <div className="border-t border-border px-5 py-3">
          <Button variant="outline" className="w-full" disabled={saving} onClick={saveAndClose}><Save />Save &amp; close</Button>
        </div>
        <div className="flex items-center gap-2 border-t border-border px-5 py-4">
          <Button variant="ghost" disabled={saving} onClick={startOver} className="px-3 text-xs text-muted-foreground underline">Start over</Button>
          {step > 0 && <Button variant="ghost" disabled={saving} onClick={() => setStep(step - 1)}>Back</Button>}
          <div className="ml-auto flex gap-2">
            {s.skippable && !last && <Button variant="outline" disabled={saving} onClick={() => setStep(step + 1)}>Skip</Button>}
            <Button disabled={saving} onClick={() => (last ? finish() : setStep(step + 1))} className="rounded-full">
              {last ? (saving ? "Saving…" : "Fill my planner") : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemList({ items, onRemove, days }: { items: NewItem[]; onRemove: (i: number) => void; days: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-3 space-y-1">
      {items.map((it, i) => (
        <li key={i} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <span className="w-9 text-xs font-semibold">{DAY_NAMES[days.indexOf(it.day)]?.slice(0, 3)}</span>
          {it.time && <span className="text-xs text-muted-foreground">{it.time}</span>}
          <span className="flex-1">{it.title}{it.location ? ` · ${it.location}` : ""}</span>
          <button aria-label="Remove" onClick={() => onRemove(i)}><X className="size-4" /></button>
        </li>
      ))}
    </ul>
  );
}
