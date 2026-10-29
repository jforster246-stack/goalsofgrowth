import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Anchor,
  Feather,
  Hourglass,
  Moon,
  Palette,
  RefreshCw,
  Sprout,
  Sunrise,
  Waves,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  MOODS,
  moodById,
  pickMantra,
  setTodayIntention,
  clearTodayIntention,
  useTodayIntention,
  type Mood,
  type MoodAccent,
  type MoodIcon,
} from "@/lib/mantras";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/intentions")({
  head: () => ({
    meta: [
      { title: "Intentions - Moongrove" },
      {
        name: "description",
        content:
          "Pick how you're feeling, or the feeling you want to shift into, and carry a matching mantra for the day.",
      },
      { property: "og:title", content: "Intentions - Moongrove" },
      {
        property: "og:description",
        content: "Choose a mood and carry a mantra for the day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IntentionsPage,
});

const ICONS: Record<MoodIcon, typeof Waves> = {
  waves: Waves,
  moon: Moon,
  sunrise: Sunrise,
  palette: Palette,
  anchor: Anchor,
  feather: Feather,
  hourglass: Hourglass,
  sprout: Sprout,
};

/** Soft tinted chip + accent text, theme-aware via the brand colour tokens. */
const ACCENT: Record<MoodAccent, { chip: string; text: string }> = {
  sky: { chip: "bg-sky/15 text-sky-deep", text: "text-sky-deep" },
  plum: { chip: "bg-plum/15 text-plum-deep", text: "text-plum-deep" },
  gold: { chip: "bg-gold/20 text-gold-deep", text: "text-gold-deep" },
  rose: { chip: "bg-rose/15 text-rose-deep", text: "text-rose-deep" },
  sage: { chip: "bg-sage/20 text-olive", text: "text-olive" },
  star: { chip: "bg-star/20 text-clay-deep", text: "text-clay-deep" },
  clay: { chip: "bg-clay/15 text-clay-deep", text: "text-clay-deep" },
  olive: { chip: "bg-olive/15 text-olive", text: "text-olive" },
};

function IntentionsPage() {
  const intention = useTodayIntention();
  const carriedMood = intention ? moodById(intention.moodId) : null;
  const [picking, setPicking] = useState<Mood | null>(null);

  return (
    <AppShell title="Intentions">
      <div className="mt-2 w-full max-w-2xl pb-4">
        {intention && carriedMood ? (
          <CarriedCard
            mood={carriedMood}
            mantra={intention.mantra}
            onChange={() => clearTodayIntention()}
          />
        ) : (
          <p className="font-serif text-sm text-muted-foreground">
            How are you feeling today? Pick what's closest — or the feeling you
            want to shift into — and I'll give you a mantra to carry.
          </p>
        )}

        <p className="mt-7 font-heading text-[11px] tracking-[0.12em] text-[#928e9d]">
          {intention ? "Choose a different feeling" : "Choose a feeling"}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MOODS.map((mood) => (
            <MoodCard
              key={mood.id}
              mood={mood}
              active={intention?.moodId === mood.id}
              onClick={() => setPicking(mood)}
            />
          ))}
        </div>
      </div>

      {picking && (
        <MantraSheet
          mood={picking}
          onCarry={(mantra) => {
            setTodayIntention(picking.id, mantra);
            setPicking(null);
          }}
          onClose={() => setPicking(null)}
        />
      )}
    </AppShell>
  );
}

/** The feeling the user is carrying today, shown as a gentle gradient hero. */
function CarriedCard({
  mood,
  mantra,
  onChange,
}: {
  mood: Mood;
  mantra: string;
  onChange: () => void;
}) {
  const Icon = ICONS[mood.icon];
  return (
    <div className="mg-hero rounded-3xl px-6 py-7 text-center shadow-sm">
      <span
        className={cn(
          "mx-auto grid size-11 place-items-center rounded-full",
          ACCENT[mood.accent].chip,
        )}
      >
        <Icon className="size-5" strokeWidth={2} />
      </span>
      <p className="mt-3 font-heading text-[11px] tracking-[0.12em] text-[#4a3d63]/70">
        Today you're carrying
      </p>
      <p className="mt-2 font-display text-2xl leading-snug text-[#201b2f]">
        "{mantra}"
      </p>
      <p className="mt-3 font-serif text-sm text-[#4a3d63]/70">{mood.name}</p>
      <button
        type="button"
        onClick={onChange}
        className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-2 font-heading text-xs tracking-wide text-[#4a3d63] shadow-sm transition-colors hover:bg-white"
      >
        <RefreshCw className="size-3.5" strokeWidth={2.5} />
        Choose a new one
      </button>
    </div>
  );
}

function MoodCard({
  mood,
  active,
  onClick,
}: {
  mood: Mood;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = ICONS[mood.icon];
  const accent = ACCENT[mood.accent];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-2.5 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 transition-all hover:-translate-y-0.5",
        active ? "ring-2 ring-olive" : "ring-border",
      )}
    >
      <span className={cn("grid size-9 place-items-center rounded-full", accent.chip)}>
        <Icon className="size-[18px]" strokeWidth={2} />
      </span>
      <span className="font-heading text-sm leading-tight text-foreground">
        {mood.name}
      </span>
      <span className={cn("font-serif text-xs", accent.text)}>{mood.cue}</span>
    </button>
  );
}

/** The "receive your mantra" moment — one mantra at a time, reshuffle or carry. */
function MantraSheet({
  mood,
  onCarry,
  onClose,
}: {
  mood: Mood;
  onCarry: (mantra: string) => void;
  onClose: () => void;
}) {
  const Icon = ICONS[mood.icon];
  const accent = ACCENT[mood.accent];
  const [mantra, setMantra] = useState(() => pickMantra(mood));

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-background p-6 pb-8 text-center shadow-xl [animation:rise_0.25s_both] sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <span className={cn("grid size-10 place-items-center rounded-full", accent.chip)}>
            <Icon className="size-5" strokeWidth={2} />
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black"
          >
            <X className="size-5" />
          </button>
        </div>

        <p className={cn("mt-4 font-heading text-[11px] tracking-[0.12em]", accent.text)}>
          {mood.name}
        </p>
        <p className="mt-3 min-h-[5.5rem] font-display text-[22px] leading-snug text-foreground">
          "{mantra}"
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => onCarry(mantra)}
            className="mg-cta w-full rounded-full py-3.5 font-heading text-sm tracking-wide text-[#4a3d63]"
          >
            Carry this today
          </button>
          <button
            type="button"
            onClick={() => setMantra((prev) => pickMantra(mood, prev))}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full py-2.5 font-heading text-xs tracking-wide text-muted-foreground transition-colors hover:text-foreground"
          >
            <RefreshCw className="size-3.5" strokeWidth={2.5} />
            Try another
          </button>
        </div>
      </div>
    </div>
  );
}
