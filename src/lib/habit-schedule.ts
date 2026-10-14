/** Habit scheduling helpers, shared by the modal, rows, and Home. */

export type Frequency =
  | "daily"
  | "weekdays"
  | "weekends"
  | "specific_days"
  | "interval"
  // legacy values kept for habits created before custom frequencies
  | "weekly"
  | "fortnightly"
  | "monthly";

export type HabitSchedule = {
  frequency: string;
  days_of_week?: string | null;
  interval_days?: number | null;
  created_at?: string;
  start_date?: string | null;
};

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function parseDays(csv?: string | null): number[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6);
}

/** Short human label, e.g. "Weekdays", "Every 3 days", "Mon, Wed". */
export function frequencyLabel(h: HabitSchedule): string {
  switch (h.frequency) {
    case "daily":
      return "Daily";
    case "weekdays":
      return "Weekdays";
    case "weekends":
      return "Weekends";
    case "specific_days": {
      const days = parseDays(h.days_of_week);
      if (days.length === 0) return "Custom days";
      if (days.length === 7) return "Daily";
      return days
        .sort((a, b) => a - b)
        .map((d) => DAY_ABBR[d])
        .join(", ");
    }
    case "interval": {
      const n = h.interval_days ?? 1;
      return n <= 1 ? "Daily" : `Every ${n} days`;
    }
    case "weekly":
      return "Weekly";
    case "fortnightly":
      return "Fortnightly";
    case "monthly":
      return "Monthly";
    default:
      return "Daily";
  }
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** The day a habit's cycle counts from: its chosen start date, else the day it was made. */
function anchorDay(h: HabitSchedule): number | null {
  if (h.start_date) {
    const [y, m, d] = h.start_date.split("-").map(Number);
    return new Date(y, m - 1, d).getTime();
  }
  if (h.created_at) return startOfDay(new Date(h.created_at));
  return null;
}

/** Whether a habit is scheduled for `today`. */
export function isHabitDueToday(h: HabitSchedule, today: Date = new Date()): boolean {
  const dow = today.getDay(); // 0 = Sun … 6 = Sat
  const anchor = anchorDay(h);
  const diff = anchor === null ? 0 : Math.round((startOfDay(today) - anchor) / 86400000);
  // Nothing shows before its start date.
  if (h.start_date && diff < 0) return false;
  const every = (n: number) => anchor === null || (diff >= 0 && diff % n === 0);
  switch (h.frequency) {
    case "weekdays":
      return dow >= 1 && dow <= 5;
    case "weekends":
      return dow === 0 || dow === 6;
    case "specific_days":
      return parseDays(h.days_of_week).includes(dow);
    case "interval":
      return every(Math.max(1, h.interval_days ?? 1));
    case "weekly":
      return every(7);
    case "fortnightly":
      return every(14);
    case "monthly":
      return every(30);
    default:
      return true;
  }
}
