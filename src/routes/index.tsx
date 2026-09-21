import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Goals of Growth — a quiet place to finish small things" },
      {
        name: "description",
        content:
          "Goals of Growth is a gentle goal tracker: create goals, break them into small steps, and check them off one calm step at a time.",
      },
      {
        property: "og:title",
        content: "Goals of Growth — a quiet place to finish small things",
      },
      {
        property: "og:description",
        content:
          "Create goals, break them into small steps, and check them off one calm step at a time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/overview", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-dvh bg-background font-body text-foreground antialiased">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
        <h1 className="font-display text-[44px] leading-tight text-focus">
          Goals of Growth
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Add a goal, break it into small steps, and tick them off. Private to
          your account, saved automatically.
        </p>

        <Link
          to="/auth"
          className="mt-8 rounded-2xl bg-primary py-3.5 text-center text-sm font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
        >
          Get started
        </Link>
      </div>
    </div>
  );
}
