import { createFileRoute, Navigate } from "@tanstack/react-router";

// Preserve old bookmarks without exposing the retired Observatory.
export const Route = createFileRoute("/_authenticated/observatory")({
  head: () => ({ meta: [
    { title: "My Moongrove wins — Moongrove" },
    { name: "description", content: "Your completed goals and logged wins in My Moongrove." },
    { property: "og:title", content: "My Moongrove wins — Moongrove" },
    { property: "og:description", content: "Celebrate completed goals and the wins you log." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <Navigate to="/gallery" replace />,
});
