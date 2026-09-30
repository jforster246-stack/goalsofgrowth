import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { StampCollections } from "@/components/stamp-collections";

export const Route = createFileRoute("/_authenticated/wins")({
  validateSearch: (search: { new?: boolean } & SearchSchemaInput) => ({
    new: search["new"] === true || (search["new"] as unknown) === "true",
  }),
  head: () => ({
    meta: [
      { title: "Wins stamps — Goals of Growth" },
      {
        name: "description",
        content:
          "Your gallery: the stamps you've collected for completed goals, achievements, and life events.",
      },
    ],
  }),
  component: WinsPage,
});

function WinsPage() {
  const { new: openNew } = Route.useSearch();
  return (
    <AppShell title="Wins stamps">
      <div className="mt-4 pb-4">
        <StampCollections defaultAdd={openNew} />
      </div>
    </AppShell>
  );
}
