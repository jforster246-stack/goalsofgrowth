import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { goalProgress, STAR_PATH } from "@/components/goal-ui";
import { goalsQueryOptions } from "@/lib/goal-queries";

export const Route = createFileRoute("/_authenticated/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Goals of Growth" },
      {
        name: "description",
        content:
          "Spend the star stamps you earn from completing goals on artworks for your gallery.",
      },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const { data: goals } = useQuery(goalsQueryOptions);
  const stamps = (goals ?? []).filter((g) => goalProgress(g).complete).length;

  return (
    <AppShell title="Gallery">
      <div className="mt-4 flex flex-col items-center justify-center gap-5 py-16 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-olive/10">
          <svg viewBox="0 0 24 24" className="size-9 fill-olive" aria-hidden>
            <path d={STAR_PATH} fillRule="evenodd" />
          </svg>
        </span>

        <div>
          <p className="font-heading text-lg uppercase tracking-wide text-olive">
            Coming soon
          </p>
          <p className="mt-2 max-w-xs font-serif text-sm leading-relaxed text-black/50">
            Spend the star stamps you earn from finishing goals on artworks to
            hang in your gallery. It's on its way.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 shadow-sm">
          <svg viewBox="0 0 24 24" className="size-4 fill-gold-deep" aria-hidden>
            <path d={STAR_PATH} fillRule="evenodd" />
          </svg>
          <span className="font-heading text-sm uppercase text-olive">
            {stamps} stamp{stamps === 1 ? "" : "s"} to spend
          </span>
        </span>
      </div>
    </AppShell>
  );
}
