import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Star, Trash2, X, Check, Timer, MapPin } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { localToday } from "@/components/goal-ui";
import { mondayWeek } from "@/lib/week-dates";
import {
  addPlannerItems,
  deletePlannerItem,
  getPlannerWeek,
  savePlannerWeek,
  updatePlannerItem,
  type Slot,
} from "@/lib/planner.functions";
import { createWin } from "@/lib/wins.functions";
import { cn } from "@/lib/utils";

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

const DAY_SLOTS: { slot: Slot; label: string }[] = [
  { slot: "morning", label: "Morning" },
  { slot: "midday", label: "Midday" },
  { slot: "awa", label: "AWA · After work activity" },
  { slot: "evening", label: "Evening" },
  { slot: "lunch", label: "Lunch" },
  { slot: "dinner", label: "Dinner" },
];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function shiftWeek(start: string, weeks: number) {
  const [y, m, d] = start.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + weeks * 7)).toISOString().slice(0, 10);
}
function niceDate(day: string) {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: "numeric", month: "short" });
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
  const thisWeek = mondayWeek(localToday())[0]!;
  const [start, setStart] = useState(thisWeek);
  const [resetOpen, setResetOpen] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  useEffect(() => { setDraftSaved(hasDraft()); }, [resetOpen]);
  const days = mondayWeek(start);
  const qc = useQueryClient();
  const { data } = useQuery(weekQuery(start));
  const items = (data?.items ?? []).filter((i) => i.day <= days[6]!);
  const refresh = () => qc.invalidateQueries({ queryKey: ["planner"] });
  const toggle = useMutation({ mutationFn: (v: { id: string; done: boolean }) => updatePlannerItem({ data: v }), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (id: string) => deletePlannerItem({ data: { id } }), onSuccess: refresh });
  const add = useMutation({ mutationFn: (v: { day: string; slot: Slot; title: string }) => addPlannerItems({ data: [v] }), onSuccess: refresh });

  return (
    <AppShell title="Planner">
      <div className="mt-2 w-full max-w-5xl pb-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button aria-label="Previous week" className="rounded-full p-2 hover:bg-muted" onClick={() => setStart(shiftWeek(start, -1))}><ChevronLeft className="size-5" /></button>
            <p className="font-heading text-lg text-foreground">Week of {niceDate(start)}</p>
            <button aria-label="Next week" className="rounded-full p-2 hover:bg-muted" onClick={() => setStart(shiftWeek(start, 1))}><ChevronRight className="size-5" /></button>
            {start !== thisWeek && <button className="ml-1 text-xs text-muted-foreground underline" onClick={() => setStart(thisWeek)}>This week</button>}
          </div>
          <button onClick={() => setResetOpen(true)} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm">
            {draftSaved ? "Continue weekly reset" : data?.week?.completed_at ? "Redo weekly reset" : "Start weekly reset"}
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {days.map((day, i) => {
            const dayItems = items.filter((it) => it.day === day);
            const allDay = dayItems.filter((it) => it.slot === "allday");
            return (
              <section key={day} className={cn("rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border", day === localToday() && "ring-2 ring-primary")}>
                <p className="font-heading text-base text-foreground">{DAY_NAMES[i]} <span className="text-sm text-muted-foreground">{niceDate(day)}</span></p>
                {allDay.map((it) => (
                  <div key={it.id} className="mt-2 flex items-center gap-2 rounded-lg bg-primary/10 px-2 py-1.5 text-sm">
                    <span className="font-semibold">{it.title}</span>
                    {it.location && <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><MapPin className="size-3" />{it.location}</span>}
                    <button aria-label="Remove" className="ml-auto text-muted-foreground" onClick={() => remove.mutate(it.id)}><X className="size-3.5" /></button>
                  </div>
                ))}
                {DAY_SLOTS.map(({ slot, label }) => (
                  <SlotBlock key={slot} label={label} slot={slot}
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
          onClose={() => setResetOpen(false)}
          onDone={(w) => { setResetOpen(false); setStart(w); refresh(); }}
        />
      )}
    </AppShell>
  );
}

type Item = { id: string; title: string; time: string | null; done: boolean; location: string | null };
function SlotBlock({ label, slot, items, onAdd, onToggle, onRemove }: {
  label: string; slot: Slot; items: Item[]; onAdd: (t: string) => void; onToggle: (id: string, d: boolean) => void; onRemove: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const meal = slot === "lunch" || slot === "dinner";
  return (
    <div className={cn("mt-3 border-t border-border pt-2", slot === "awa" && "rounded-lg bg-sage/10 px-2", meal && "border-dashed")}>
      <div className="flex items-center justify-between">
        <p className="font-serif text-xs italic text-muted-foreground">{label}</p>
        <button aria-label={`Add to ${label}`} className="text-muted-foreground hover:text-foreground" onClick={() => setAdding((a) => !a)}><Plus className="size-4" /></button>
      </div>
      {items.map((it) => (
        <div key={it.id} className="group mt-1 flex items-start gap-2 text-sm">
          {!meal && (
            <button aria-label={it.done ? "Mark not done" : "Mark done"} onClick={() => onToggle(it.id, !it.done)}
              className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded border border-border", it.done && "bg-primary text-primary-foreground")}>
              {it.done && <Check className="size-3" />}
            </button>
          )}
          <span className={cn("flex-1", it.done && "text-muted-foreground line-through")}>
            {it.time && <span className="mr-1 text-xs text-muted-foreground">{it.time}</span>}{it.title}
          </span>
          <button aria-label="Remove" className="text-muted-foreground opacity-60 hover:opacity-100" onClick={() => onRemove(it.id)}><Trash2 className="size-3.5" /></button>
        </div>
      ))}
      {adding && (
        <form className="mt-1 flex gap-1" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onAdd(text.trim()); setText(""); setAdding(false); } }}>
          <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Add…" className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm" />
          <button className="rounded-md bg-primary px-2 text-xs text-primary-foreground">Add</button>
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
          {DAY_NAMES[i]!.slice(0, 3)}
        </button>
      ))}
    </div>
  );
}

const DRAFT_KEY = "gog-planner-reset-draft";
type ResetDraft = Record<string, unknown>;
function loadDraft(): ResetDraft | null {
  try { const raw = localStorage.getItem(DRAFT_KEY); return raw ? (JSON.parse(raw) as ResetDraft) : null; } catch { return null; }
}
function hasDraft() { return typeof window !== "undefined" && loadDraft() !== null; }

function WeeklyReset({ defaultWeek, thisWeek, hobbies, onClose, onDone }: {
  defaultWeek: string; thisWeek: string; hobbies: { id: string; name: string }[]; onClose: () => void; onDone: (w: string) => void;
}) {
  const [draft] = useState(loadDraft);
  const d = <T,>(k: string, fallback: T): T => (draft && k in draft ? (draft[k] as T) : fallback);
  const [step, setStep] = useState(() => d("step", 0));
  const [week, setWeek] = useState(() => d("week", defaultWeek));
  const days = mondayWeek(week);
  const [audit, setAudit] = useState<Record<string, number>>(() => d("audit", {}));
  const [wins, setWins] = useState<string[]>(() => d("wins", []));
  const [winText, setWinText] = useState("");
  const [events, setEvents] = useState<NewItem[]>(() => d("events", []));
  const [ev, setEv] = useState({ day: days[0]!, time: "", title: "" });
  const [ooo, setOoo] = useState<NewItem[]>(() => d("ooo", []));
  const [oooForm, setOooForm] = useState({ day: days[0]!, location: "" });
  const [awa, setAwa] = useState<NewItem[]>(() => d("awa", []));
  const [awaDay, setAwaDay] = useState(days[0]!);
  const [awaCustom, setAwaCustom] = useState("");
  const [myself, setMyself] = useState(() => d("myself", { text: "", day: days[5]! }));
  const [reflect, setReflect] = useState(() => d("reflect", { habits: "", routines: "" }));
  const [dinners, setDinners] = useState<string[]>(() => d("dinners", Array(7).fill("")));

  // Save progress after every change so the reset can be continued later.
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, week, audit, wins, events, ooo, awa, myself, reflect, dinners }));
    } catch { /* storage unavailable */ }
  }, [step, week, audit, wins, events, ooo, awa, myself, reflect, dinners]);
  const firstWeek = useRef(true);
  const [saving, setSaving] = useState(false);

  // Keep day pickers inside the chosen week.
  useEffect(() => {
    if (firstWeek.current) { firstWeek.current = false; return; }
    setEv((e) => ({ ...e, day: days[0]! }));
    setOooForm((o) => ({ ...o, day: days[0]! }));
    setAwaDay(days[0]!);
    setMyself((m) => ({ ...m, day: days[5]! }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week]);

  const finish = async () => {
    setSaving(true);
    try {
      const all: NewItem[] = [
        ...ooo, ...events, ...awa,
        ...(myself.text.trim() ? [{ day: myself.day, slot: "evening" as Slot, title: `For me: ${myself.text.trim()}` }] : []),
        ...dinners.flatMap((d, i) => (d.trim() ? [{ day: days[i]!, slot: "dinner" as Slot, title: d.trim() }] : [])),
      ].map((i) => ({ ...i, day: i.day }));
      await addPlannerItems({ data: all });
      for (const w of wins) await createWin({ data: { title: w.slice(0, 140), kind: "achievement" } });
      await savePlannerWeek({ data: { weekStart: week, audit, reflections: { ...reflect, myself: myself.text } } });
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      onDone(week);
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
                {l} · {niceDate(w)}
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
            <div className="flex flex-wrap gap-1.5">
              {hobbies.map((h) => (
                <button key={h.id} onClick={() => setAwa([...awa, { day: awaDay, slot: "awa", title: h.name }])}
                  className="rounded-full bg-sage/20 px-3 py-1 text-xs text-foreground hover:bg-sage/40">+ {h.name}</button>
              ))}
            </div>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (awaCustom.trim()) { setAwa([...awa, { day: awaDay, slot: "awa", title: awaCustom.trim() }]); setAwaCustom(""); } }}>
              <input value={awaCustom} onChange={(e) => setAwaCustom(e.target.value)} placeholder="Something else…" className={input} />
              <button className="rounded-lg bg-primary px-3 text-sm text-primary-foreground">Add</button>
            </form>
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
                <span className="w-12 text-xs font-semibold">{DAY_NAMES[i]!.slice(0, 3)}</span>
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
  const s = steps[step]!;
  const last = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 sm:items-center" role="dialog" aria-modal="true">
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl bg-card shadow-xl sm:rounded-3xl">
        <div className="flex items-center justify-between px-5 pt-5">
          <p className="text-xs text-muted-foreground">Weekly reset · {step + 1} of {steps.length} · <span className="italic">saved</span></p>
          <button aria-label="Close" onClick={onClose}><X className="size-5" /></button>
        </div>
        <div className="mx-5 mt-2 h-1 rounded-full bg-muted"><div className="h-1 rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
        <div className="overflow-y-auto px-5 py-4">
          <h2 className="mb-3 font-heading text-xl text-foreground">{s.title}</h2>
          {s.body}
        </div>
        <div className="flex items-center gap-2 border-t border-border px-5 py-4">
          <button onClick={() => { if (confirm("Start the weekly reset over? Your saved answers will be cleared.")) { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } onClose(); } }} className="rounded-full px-3 py-2 text-xs text-muted-foreground underline">Start over</button>
          {step > 0 && <button onClick={() => setStep(step - 1)} className="rounded-full px-4 py-2 text-sm text-muted-foreground">Back</button>}
          <div className="ml-auto flex gap-2">
            {s.skippable && !last && <button onClick={() => setStep(step + 1)} className="rounded-full px-4 py-2 text-sm ring-1 ring-border">Skip</button>}
            <button disabled={saving} onClick={() => (last ? finish() : setStep(step + 1))} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              {last ? (saving ? "Saving…" : "Fill my planner") : "Next"}
            </button>
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
