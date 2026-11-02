import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Palette, Plus, Sparkles, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell, useAppShell } from "@/components/app-shell";
import { awaLogsQueryOptions } from "@/lib/goal-queries";
import {
  COURSES,
  courseById,
  courseFactTotal,
  lessonProgress,
  type Course,
  type CourseIcon,
  type Lesson,
} from "@/lib/curriculum-data";
import {
  availableReveals,
  ensureBaseline,
  revealNextFact,
  useCurriculumSync,
  revealedIn,
  useCurriculum,
} from "@/lib/curriculum";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/observatory")({
  head: () => ({
    meta: [
      { title: "The Observatory - Moongrove" },
      {
        name: "description",
        content:
          "A little knowledge, earned by doing what you love. Spend time on your hobbies to reveal facts about art and the night sky.",
      },
      { property: "og:title", content: "The Observatory - Moongrove" },
      {
        property: "og:description",
        content: "Earn a little knowledge by spending time on the hobbies you love.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ObservatoryPage,
});

const COURSE_ICONS: Record<CourseIcon, typeof Palette> = {
  palette: Palette,
  star: Star,
};

function ObservatoryPage() {
  return (
    <AppShell title="The Observatory">
      <ObservatoryBody />
    </AppShell>
  );
}

function ObservatoryBody() {
  const { data: logs } = useQuery(awaLogsQueryOptions);
  useCurriculumSync();
  const store = useCurriculum();
  const { celebrate } = useAppShell();

  const logCount = logs?.length ?? 0;
  const [activeId, setActiveId] = useState<string>(COURSES[0]!.id);

  // On first open, remember the current A While Away log count so only time
  // logged from here on earns reveals.
  useEffect(() => {
    if (logs && store.baseline === null) ensureBaseline(logCount);
  }, [logs, logCount, store.baseline]);

  const available = availableReveals(store, logCount);
  const course = courseById(activeId) ?? COURSES[0]!;
  const revealed = revealedIn(store, course.id);
  const progress = lessonProgress(course, revealed);
  const lesson = course.lessons[progress.lessonIndex]!;

  const reveal = () => {
    if (available <= 0 || progress.allComplete) return;
    // If this reveal finishes the lesson, mark the moment with confetti.
    if (progress.revealedInLesson + 1 >= progress.lessonCount) celebrate();
    revealNextFact(course.id);
  };

  return (
    <div className="mt-2 w-full max-w-2xl pb-4">
      <p className="font-serif text-sm italic text-black/45">
        A little knowledge, earned by doing what you love.
      </p>

      <RevealsBanner available={available} />

      <LessonCard
        course={course}
        lesson={lesson}
        progress={progress}
        available={available}
        onReveal={reveal}
      />

      <section className="mt-7">
        <p className="font-heading text-[11px] tracking-[0.12em] text-[#928e9d]">Your courses</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {COURSES.map((c) => (
            <CourseTile
              key={c.id}
              course={c}
              revealed={revealedIn(store, c.id)}
              active={c.id === course.id}
              onClick={() => setActiveId(c.id)}
            />
          ))}
          <AddSubjectTile />
        </div>
      </section>
    </div>
  );
}

/** How many reveals are waiting, and where they come from. */
function RevealsBanner({ available }: { available: number }) {
  if (available > 0) {
    return (
      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sage/25 text-olive">
          <Sparkles className="size-[18px]" strokeWidth={2} />
        </span>
        <p className="min-w-0 flex-1 font-serif text-sm leading-snug text-black/70">
          <span className="font-heading text-olive">
            {available} {available === 1 ? "reveal" : "reveals"} ready
          </span>{" "}
          - earned from your time in A While Away.
        </p>
      </div>
    );
  }

  return (
    <Link
      to="/awa"
      className="mt-5 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-olive/[0.03]"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-black/5 text-black/40">
        <Lock className="size-[18px]" strokeWidth={2} />
      </span>
      <p className="min-w-0 flex-1 font-serif text-sm leading-snug text-black/60">
        Log a little time in{" "}
        <span className="font-heading text-olive">A While Away</span> to earn your next reveal.
      </p>
    </Link>
  );
}

function LessonCard({
  course,
  lesson,
  progress,
  available,
  onReveal,
}: {
  course: Course;
  lesson: Lesson;
  progress: ReturnType<typeof lessonProgress>;
  available: number;
  onReveal: () => void;
}) {
  const Icon = COURSE_ICONS[course.icon];

  return (
    <section className="mt-5 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
      {/* Plate */}
      <div
        className="relative aspect-[4/3] w-full overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, ${lesson.tint[0]} 0%, ${lesson.tint[1]} 100%)`,
        }}
      >
        {lesson.image ? (
          <img
            src={lesson.image}
            alt={lesson.title}
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <Icon
            className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 text-black/[0.07]"
            strokeWidth={1.25}
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 font-heading text-[10px] tracking-[0.1em] text-olive shadow-sm">
          {progress.allComplete
            ? `${course.name} · complete`
            : `${course.name} · lesson ${progress.lessonIndex + 1} of ${course.lessons.length}`}
        </span>
      </div>

      <div className="px-5 pb-5 pt-4">
        <h2 className="font-display text-xl leading-snug text-[#201b2f]">{lesson.title}</h2>
        <p className="mt-1 font-serif text-sm italic text-black/50">
          {lesson.subtitle} · {lesson.meta}
        </p>

        {/* Progress — stars lighting up */}
        <div className="mt-3 flex items-center gap-2">
          <span className="flex gap-1">
            {lesson.facts.map((_, i) => (
              <Sparkles
                key={i}
                className={cn(
                  "size-4",
                  i < progress.revealedInLesson ? "text-gold-deep" : "text-black/15",
                )}
                strokeWidth={2}
              />
            ))}
          </span>
          <span className="font-heading text-[11px] tracking-wide text-black/45">
            {progress.revealedInLesson} of {progress.lessonCount} revealed
          </span>
        </div>

        {/* Facts */}
        <div className="mt-5 space-y-2.5">
          {lesson.facts.map((fact, i) => {
            if (i < progress.revealedInLesson) return <RevealedFact key={i} text={fact} />;
            if (i === progress.revealedInLesson)
              return (
                <NextFact
                  key={i}
                  index={i}
                  canReveal={available > 0}
                  onReveal={onReveal}
                />
              );
            return <LockedFact key={i} />;
          })}
        </div>

        {progress.allComplete && (
          <p className="mt-5 rounded-2xl bg-sage/10 px-4 py-3 text-center font-serif text-sm italic text-olive">
            You've learned every piece in {course.name}. Lovely work.
          </p>
        )}
      </div>
    </section>
  );
}

function RevealedFact({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-sage/10 px-3.5 py-3">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-sage/30 text-olive">
        <Sparkles className="size-3.5" strokeWidth={2} />
      </span>
      <p className="font-serif text-sm leading-relaxed text-black/80">{text}</p>
    </div>
  );
}

function NextFact({
  index,
  canReveal,
  onReveal,
}: {
  index: number;
  canReveal: boolean;
  onReveal: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3",
        canReveal ? "bg-white ring-1 ring-olive/25" : "bg-black/[0.03]",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-full",
            canReveal ? "bg-olive/10 text-olive" : "bg-black/5 text-black/30",
          )}
        >
          <Lock className="size-3.5" strokeWidth={2} />
        </span>
        <p className="font-serif text-sm italic text-black/40">
          Piece {index + 1} - {canReveal ? "ready to reveal" : "waiting for your next reveal"}
        </p>
      </div>
      {canReveal && (
        <button
          type="button"
          onClick={onReveal}
          className="shrink-0 rounded-full bg-olive px-3.5 py-2 font-heading text-[11px] tracking-wide text-white shadow-sm transition-transform hover:-translate-y-0.5"
        >
          Reveal
        </button>
      )}
    </div>
  );
}

function LockedFact() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-black/[0.03] px-3.5 py-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-black/5 text-black/30">
        <Lock className="size-3.5" strokeWidth={2} />
      </span>
      <span className="h-2.5 flex-1 rounded-full bg-black/[0.06]" />
    </div>
  );
}

function CourseTile({
  course,
  revealed,
  active,
  onClick,
}: {
  course: Course;
  revealed: number;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = COURSE_ICONS[course.icon];
  const progress = lessonProgress(course, revealed);
  const total = courseFactTotal(course);
  const meta = progress.allComplete
    ? "Complete"
    : `Lesson ${progress.lessonIndex + 1} of ${course.lessons.length}`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-col gap-2 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 transition-all hover:-translate-y-0.5",
        active ? "ring-2 ring-olive" : "ring-black/5",
      )}
    >
      <span className="grid size-9 place-items-center rounded-full bg-sage/25 text-olive">
        <Icon className="size-5" strokeWidth={2} />
      </span>
      <span className="font-heading text-sm text-[#201b2f]">{course.name}</span>
      <span className="font-serif text-xs text-black/45">{meta}</span>
      <span className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
        <span
          className="block h-full rounded-full bg-olive/70"
          style={{ width: `${total ? (revealed / total) * 100 : 0}%` }}
        />
      </span>
    </button>
  );
}

function AddSubjectTile() {
  return (
    <div className="flex min-h-[132px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-olive/30 px-3 text-center text-olive/50">
      <Plus className="size-5" strokeWidth={2} />
      <span className="font-heading text-xs">Add a subject</span>
      <span className="font-serif text-[11px] italic text-black/30">Coming soon</span>
    </div>
  );
}
