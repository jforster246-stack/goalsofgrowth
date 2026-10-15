import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Loading } from "@/components/loading";
import { Motif } from "@/components/motif-icons";
import { MenuFormModal, type MenuDraft } from "@/components/menu-ui";
import { deleteMenu, listMenus, saveMenu } from "@/lib/menus.functions";

export const Route = createFileRoute("/_authenticated/awa/menus/")({
  head: () => ({
    meta: [
      { title: "Menus — Goals of Growth" },
      {
        name: "description",
        content: "Your own menus of activities to pick from based on the time and energy you have.",
      },
      { property: "og:title", content: "Menus — Goals of Growth" },
      { property: "og:description", content: "Pick what to do based on your time and energy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MenusPage,
});

const EXAMPLES: { name: string; description: string }[] = [
  { name: "After work", description: "Gentle ways to unwind once you're home" },
  { name: "Quick cleaning reset", description: "Five-to-fifteen minute tidy-ups" },
  { name: "Low-energy activities", description: "For the slow, tired days" },
  { name: "Creative projects", description: "Making, drawing, writing" },
  { name: "Weekend to-dos", description: "Errands and bigger jobs" },
];

type Menu = Awaited<ReturnType<typeof listMenus>>[number];

function MenusPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: menus, isPending, error } = useQuery({ queryKey: ["menus"], queryFn: () => listMenus() });
  const [form, setForm] = useState<{ menu?: Menu; prefill?: Partial<MenuDraft> } | null>(null);

  const save = useMutation({
    mutationFn: (d: MenuDraft & { id?: string }) => saveMenu({ data: d }),
    onSuccess: (res, vars) => {
      qc.invalidateQueries({ queryKey: ["menus"] });
      qc.invalidateQueries({ queryKey: ["menu"] });
      setForm(null);
      if (!vars.id) navigate({ to: "/awa/menus/$menuId", params: { menuId: res.id } });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteMenu({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menus"] }),
  });

  return (
    <AppShell title="Menus" hideSettings>
      <div className="mt-2 w-full pb-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-serif text-sm text-muted-foreground">
            Pick something to do based on the time and energy you have.
          </p>
          <button
            type="button"
            onClick={() => setForm({})}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="size-4" /> Create a menu
          </button>
        </div>

        {isPending ? (
          <Loading />
        ) : error ? (
          <p className="mt-6 text-sm text-destructive">Couldn't load your menus. Please refresh.</p>
        ) : (menus ?? []).length === 0 ? (
          <div className="mt-6 rounded-3xl bg-card p-6 text-center ring-1 ring-border">
            <BookOpen className="mx-auto size-8 text-olive" />
            <p className="mt-3 font-heading text-lg text-foreground">No menus yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Make collections of activities for different moods, energy levels or situations. Then
              when you have free time, open one and it'll suggest what fits.
            </p>
            <p className="mt-5 font-serif text-xs italic text-muted-foreground">Ideas to start with</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.name}
                  type="button"
                  onClick={() => setForm({ prefill: ex })}
                  className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-foreground/70 hover:bg-black/10"
                >
                  + {ex.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {menus!.map((m) => (
              <div key={m.id} className="relative flex flex-col rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
                <Link
                  to="/awa/menus/$menuId"
                  params={{ menuId: m.id }}
                  className="flex flex-1 items-start gap-3 pr-16"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-olive/10 text-olive">
                    {m.icon ? <Motif id={m.icon} className="size-6" /> : <BookOpen className="size-5" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-heading text-base text-foreground">{m.name}</span>
                    {m.description && (
                      <span className="mt-0.5 block text-sm text-muted-foreground line-clamp-2">{m.description}</span>
                    )}
                    <span className="mt-2 block text-xs text-muted-foreground">
                      {m.activity_count} activit{m.activity_count === 1 ? "y" : "ies"}
                      {m.category ? ` · ${m.category}` : ""}
                    </span>
                  </span>
                </Link>
                <div className="absolute right-2 top-2 flex">
                  <button
                    type="button"
                    aria-label={`Edit ${m.name}`}
                    onClick={() => setForm({ menu: m })}
                    className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-black/5"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${m.name}`}
                    onClick={() => {
                      if (confirm(`Delete the "${m.name}" menu? Linked goals and hobbies stay as they are.`))
                        remove.mutate(m.id);
                    }}
                    className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-black/5"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {form && (
        <MenuFormModal
          title={form.menu ? "Edit menu" : "New menu"}
          initial={
            form.menu
              ? {
                  name: form.menu.name,
                  description: form.menu.description ?? "",
                  category: form.menu.category ?? "",
                  icon: form.menu.icon,
                }
              : form.prefill
          }
          saving={save.isPending}
          onSave={(d) => save.mutate(form.menu ? { ...d, id: form.menu.id } : d)}
          onClose={() => setForm(null)}
        />
      )}
    </AppShell>
  );
}
