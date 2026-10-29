import { createFileRoute, redirect } from "@tanstack/react-router";

// Wins merged into the "Your universe" page (the gallery). Keep this route as a
// redirect so old links and bookmarks still land somewhere sensible.
export const Route = createFileRoute("/_authenticated/wins")({
  beforeLoad: () => {
    throw redirect({ to: "/gallery" });
  },
});
