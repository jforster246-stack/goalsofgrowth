import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar, Check, Sparkle, Timer, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/habits")({
  head: () => ({
    meta: [{ title: "Habits — Goals of Growth" }],
  }),
  component: HabitsPage,
});

// Sample data only — nothing here is saved yet. Once you're ready to make
// this real, these will come from a database table instead.
const SAMPLE_HABITS = [
  {
    id: "h1",
    title: "Morning pages",
    subtitle: "Three pages, first thing",
    accent: "bg-emerald-800",
  },
  {
    id: "h2",
    title: "Stretch for 10 minutes",
    subtitle: "Keep the body loose",
    accent: "bg-amber-800",
  },
  {
    id: "h3",
    title: "No phone before breakfast",
    subtitle: "Start the day present",
    accent: "bg-rose-900",
  },
];

function HabitsPage() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [timerHabit, setTimerHabit] = useState<{ id: string; title: string } | null>(null);
  const [reminderHabit, setReminderHabit] = useState<{ id: string; title: string } | null>(null);

  return (
    <AppShell title="Habits" backTo="/overview">
      <div className="mt-5 space-y-2.5">
        {SAMPLE_HABITS.map((habit) => (
          <div
            key={habit.id}
            className="flex items-center gap-3 rounded-xl bg-card px-3 py-2.5 shadow-sm ring-1 ring-border"
          >
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-full ${habit.accent}`}
            >
              <Sparkle className="size-4 text-white" strokeWidth={1.5} />
            </span>

            <button
              onClick={() => setReminderHabit({ id: habit.id, title: habit.title })}
              className="min-w-0 flex-1 text-left"
            >
              <p
                className={`truncate text-sm font-medium ${done[habit.id] ? "text-muted-foreground line-through" : ""}`}
              >
                {habit.title}
              </p>
              <p className="truncate text-xs italic text-muted-foreground">
                {habit.subtitle}
              </p>
            </button>

            <button
              onClick={() => setTimerHabit({ id: habit.id, title: habit.title })}
              className={`flex size-8 shrink-0 items-center justify-center rounded-full ${habit.accent} text-white`}
              aria-label={`Start a timer for ${habit.title}`}
            >
              <Timer className="size-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={() =>
                setDone((prev) => ({ ...prev, [habit.id]: !prev[habit.id] }))
              }
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-foreground ${done[habit.id] ? "bg-focus text-white" : "bg-muted"}`}
              aria-label={`Mark ${habit.title} done for today`}
            >
              <Check className="size-4" strokeWidth={2} />
            </button>
          </div>
        ))}

        <p className="pt-4 text-center text-xs text-muted-foreground">
          These are sample habits to preview the design — nothing here saves yet.
        </p>
      </div>

      {timerHabit && (
        <HabitTimerModal habit={timerHabit} onClose={() => setTimerHabit(null)} />
      )}
      {reminderHabit && (
        <ReminderModal habit={reminderHabit} onClose={() => setReminderHabit(null)} />
      )}
    </AppShell>
  );
}

function HabitTimerModal({
  habit,
  onClose,
}: {
  habit: { id: string; title: string };
  onClose: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(20 * 60);

  useState(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  });

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-5">
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-xl">
        <button
          onClick={onClose}
          aria-label="Close timer"
          className="ml-auto grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>
        <p className="text-sm font-medium text-muted-foreground">{habit.title}</p>
        <p className="mt-4 font-display text-6xl tabular-nums">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </p>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function ReminderModal({
  habit,
  onClose,
}: {
  habit: { id: string; title: string };
  onClose: () => void;
}) {
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [weekday, setWeekday] = useState("MO");
  const [time, setTime] = useState("08:00");

  const buildCalendarLink = () => {
    const [hours, minutes] = time.split(":").map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    if (start.getTime() < Date.now()) start.setDate(start.getDate() + 1);
    const end = new Date(start.getTime() + 15 * 60 * 1000);

    const format = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const rrule =
      frequency === "daily" ? "FREQ=DAILY" : `FREQ=WEEKLY;BYDAY=${weekday}`;

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `SUMMARY:${habit.title}`,
      `DTSTART:${format(start)}`,
      `DTEND:${format(end)}`,
      `RRULE:${rrule}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-sm rounded-t-3xl bg-card p-6 shadow-xl sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold">Remind me</p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{habit.title}</p>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Repeats
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setFrequency("daily")}
              className={`flex-1 rounded-xl py-2 text-sm font-medium ${frequency === "daily" ? "bg-focus text-white" : "bg-muted text-foreground"}`}
            >
              Every day
            </button>
            <button
              onClick={() => setFrequency("weekly")}
              className={`flex-1 rounded-xl py-2 text-sm font-medium ${frequency === "weekly" ? "bg-focus text-white" : "bg-muted text-foreground"}`}
            >
              Weekly
            </button>
          </div>
        </div>

        {frequency === "weekly" && (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Day
            </p>
            <select
              value={weekday}
              onChange={(e) => setWeekday(e.target.value)}
              className="mt-2 w-full rounded-xl bg-muted/60 px-3 py-2.5 text-sm"
            >
              <option value="MO">Monday</option>
              <option value="TU">Tuesday</option>
              <option value="WE">Wednesday</option>
              <option value="TH">Thursday</option>
              <option value="FR">Friday</option>
              <option value="SA">Saturday</option>
              <option value="SU">Sunday</option>
            </select>
          </div>
        )}

        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Time
          </p>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-2 w-full rounded-xl bg-muted/60 px-3 py-2.5 text-sm"
          />
        </div>

        
          href={buildCalendarLink()}
          download={`${habit.title}.ics`}
          onClick={() => setTimeout(onClose, 300)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
        >
          <Calendar className="size-4" strokeWidth={2} />
          Add to Calendar
        </a>
      </div>
    </div>
  );
}
