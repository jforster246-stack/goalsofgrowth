import { createFileRoute, Navigate } from "@tanstack/react-router";

// Menus now live inside the A While Away page's Menus tab.
export const Route = createFileRoute("/_authenticated/awa/menus/")({
  component: () => <Navigate to="/awa" search={{ tab: "menus" } as never} />,
});
