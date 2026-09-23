import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    // First-run onboarding: show /welcome once per device until completed.
    let onboarded = true;
    try {
      onboarded = localStorage.getItem("gog-onboarded") === "1";
    } catch {
      onboarded = true;
    }
    if (!onboarded && location.pathname !== "/welcome") {
      throw redirect({ to: "/welcome" });
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});
