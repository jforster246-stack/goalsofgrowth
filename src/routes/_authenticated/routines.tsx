import { createFileRoute } from "@tanstack/react-router";
import { Sparkle } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/routines")({
  head: () => ({
    meta: [{ title: "Routines — Goals of Growth" }],
  }),
  component: RoutinesPage,
});

function RoutinesPage() {
  return (
    <AppShell title="Routines" backTo="/overview">
      <div className="flex flex-col items-center justify-center gap-3 py-28 text-center">
        <Sparkle className="size-10 text-focus" strokeWidth={1.25} />
        <p className="text-lg font-semibold">Coming soon</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Routines are on their way — check back soon.
        </p>
      </div>
    </AppShell>
  );
}
