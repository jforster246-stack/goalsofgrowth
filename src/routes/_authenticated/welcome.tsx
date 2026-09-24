import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Repeat, Stamp, Target, Timer, Trophy } from "lucide-react";
import { StarField, STAR_PATH } from "@/components/goal-ui";
import { cn } from "@/lib/utils";

export const ONBOARDED_KEY = "gog-onboarded";

export const Route = createFileRoute("/_authenticated/welcome")({
  head: () => ({
    meta: [{ title: "Welcome — Goals of Growth" }],
  }),
  component: WelcomePage,
});

type Slide = {
  hero: "star" | typeof Target;
  accent: string;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    hero: "star",
    accent: "text-olive",
    title: "Welcome to Goals of Growth",
    body: "A calm place to grow — set goals, build habits, and celebrate every win, one small step at a time.",
  },
  {
    hero: Target,
    accent: "bg-olive",
    title: "Set goals, step by step",
    body: "Add a goal, break it into next steps, and tick them off as you go. Start a focus timer on any step when you want to knuckle down.",
  },
  {
    hero: Repeat,
    accent: "bg-gold-deep",
    title: "Build daily habits",
    body: "Add habits for the morning, afternoon or evening, and tick them off each day to build streaks.",
  },
  {
    hero: Trophy,
    accent: "bg-clay-deep",
    title: "Collect your stamps",
    body: "Finish a goal to earn a star stamp. They collect on your Wins stamps page, and soon you'll spend them on artworks in the gallery.",
  },
  {
    hero: Plus,
    accent: "bg-olive",
    title: "Everything starts with +",
    body: "Tap the + button any time to add a goal, habit, routine, focus session or win. That's it — let's grow.",
  },
];

export function WelcomePage() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  const slide = SLIDES[index]!;
  const isLast = index === SLIDES.length - 1;

  const finish = () => {
    try {
      localStorage.setItem(ONBOARDED_KEY, "1");
    } catch {
      // ignore (private mode etc.) — worst case they see it again
    }
    navigate({ to: "/overview", replace: true });
  };

  const next = () => (isLast ? finish() : setIndex((i) => i + 1));

  return (
    <div className="relative min-h-dvh bg-background font-body text-foreground antialiased">
      <StarField />
      <div className="relative z-[1] mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-8 pt-6">
        {/* Skip */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={finish}
            className="font-heading text-xs uppercase tracking-wide text-black/40 transition-colors hover:text-black/70"
          >
            Skip
          </button>
        </div>

        {/* Slide */}
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {slide.hero === "star" ? (
            <svg viewBox="0 0 24 24" className={cn("size-24 fill-olive")} aria-hidden>
              <path d={STAR_PATH} fillRule="evenodd" />
            </svg>
          ) : (
            <span
              className={cn(
                "grid size-24 place-items-center rounded-full text-white",
                slide.accent,
              )}
            >
              <slide.hero className="size-11" strokeWidth={1.5} />
            </span>
          )}

          <h1 className="mt-8 font-display text-[34px] leading-tight text-black">
            {slide.title}
          </h1>
          <p className="mt-4 max-w-xs font-serif text-base leading-relaxed text-black/60">
            {slide.body}
          </p>

          {index === 3 && (
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
              <Stamp className="size-4 text-clay-deep" strokeWidth={2} />
              <span className="font-heading text-[11px] uppercase text-olive">
                A star stamp per goal
              </span>
            </span>
          )}
          {index === 1 && (
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
              <Timer className="size-4 text-olive" strokeWidth={2} />
              <span className="font-heading text-[11px] uppercase text-olive">
                Focus timer built in
              </span>
            </span>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-2 rounded-full transition-all",
                i === index ? "w-6 bg-olive" : "w-2 bg-black/15",
              )}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center gap-2">
          {index > 0 && (
            <button
              type="button"
              onClick={() => setIndex((i) => i - 1)}
              className="rounded-2xl px-5 py-3.5 font-heading text-sm uppercase text-black/50 transition-colors hover:text-black/80"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={next}
            className="flex-1 rounded-2xl bg-olive py-3.5 font-heading text-sm uppercase text-white shadow-sm transition-colors hover:bg-olive/90"
          >
            {isLast ? "Get started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
