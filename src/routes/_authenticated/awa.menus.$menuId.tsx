import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Check, Clock, Pencil, Plus, Shuffle, Target, Armchair, Timer, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAppShell } from "@/components/app-shell-context";
import { Loading } from "@/components/loading";
import { ModalShell } from "@/components/artwork-modal";
import { AwaLogModal } from "@/components/awa-log-modal";
import { localToday } from "@/components/goal-ui";
import { useFocusTimerEnabled } from "@/lib/focus-timer";
import {
  ActivityFields,
  Chip,
  EnergyDots,
  KIND_LABEL,
  MenuFormModal,
  durationText,
  inputClass,
  type ActivityDraft,
  type Energy,
  type Kind,
} from "@/components/menu-ui";
import {
  addMenuActivity,
  getMenu,
  listActivitySources,
  removeMenuActivity,
  saveMenu,
  setMenuActivityDone,
  updateMenuActivity,
} from "@/lib/menus.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/awa/menus/$menuId")({
  head: () => ({
    meta: [
      { title: "Menu — Goals of Growth" },
      { name: "description", content: "Choose an activity that fits your time and energy." },
      { property: "og:title", content: "Menu — Goals of Growth" },
      { property: "og:description", content: "Choose an activity that fits your time and energy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MenuPage,
});

type Item = NonNullable<Awaited<ReturnType<typeof getMenu>>>["items"][number];
type TimeOpt = 5 | 15 | 30 | 60 | "flex";
const TIMES: { v: TimeOpt; label: string }[] = [
  { v: 5, label: "5 min" },
  { v: 15, label: "15 min" },
  { v: 30, label: "30 min" },
  { v: 60, label: "1 hour" },
  { v: "flex", label: "Flexible" },
];
const ENERGY_RANK: Record<Energy, number> = { low: 1, medium: 2, high: 3 };

function MenuPage() {
  const { menuId } = Route.useParams();
  const { data, isPending, error } = useQuery({
    queryKey: ["menu", menuId],
    queryFn: () => getMenu({ data: { id: menuId } }),
  });
  return (
    <AppShell title={data?.menu.name ?? "Menu"} backTo="/menus" hideSettings>
      {isPending ? (
        <Loading />
      ) : error ? (
        <p className="mt-6 text-sm text-destructive">Couldn't load this menu. Please refresh.</p>
      ) : !data ? (
        <p className="mt-6 text-sm text-muted-foreground">
          This menu no longer exists. <Link to="/menus" className="underline">Back to menus</Link>
        </p>
      ) : (
        <MenuBody menuId={menuId} menu={data.menu} items={data.items} />
      )}
    </AppShell>
  );
}

function MenuBody({
  menuId,
  menu,
  items,
}: {
  menuId: string;
  menu: NonNullable<Awaited<ReturnType<typeof getMenu>>>["menu"];
  items: Item[];
}) {
  const qc = useQueryClient();
  const { openTimer, celebrate } = useAppShell();
  const focusEnabled = useFocusTimerEnabled();
  const today = localToday();
  const [time, setTime] = useState<TimeOpt | null>(null);
  const [energy, setEnergy] = useState<Energy | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [editingMenu, setEditingMenu] = useState(false);
  const [logHobby, setLogHobby] = useState<Item["hobby"] | null>(null);
  const [doneLocal, setDoneLocal] = useState<Record<string, boolean>>({});

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["menu"] });
    qc.invalidateQueries({ queryKey: ["menus"] });
    qc.invalidateQueries({ queryKey: ["activity-sources"] });
  };

  const isDone = (i: Item) => doneLocal[i.id] ?? i.last_done_on === today;

  const doneMutation = useMutation({
    mutationFn: (v: { id: string; done: boolean }) => setMenuActivityDone({ data: { ...v, today } }),
    onMutate: (v) => setDoneLocal((s) => ({ ...s, [v.id]: v.done })),
    onError: (_e, v) => setDoneLocal((s) => ({ ...s, [v.id]: !v.done })),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["goal"] });
    },
  });

  const markDone = (i: Item, done: boolean) => {
    doneMutation.mutate({ id: i.id, done });
    if (done) {
      celebrate();
      if (i.hobby) setLogHobby(i.hobby);
    }
  };

  const removeMutation = useMutation({
    mutationFn: (i: Item) => removeMenuActivity({ data: { itemId: i.itemId, activityId: i.id } }),
    onSuccess: invalidate,
  });

  const filtering = !showAll && (time !== null || energy !== null);
  const matches = useMemo(() => {
    if (!filtering) return items;
    return items.filter((i) => {
      if (time !== null && time !== "flex") {
        if (i.duration_minutes == null || i.duration_minutes > time) return false;
      }
      if (energy !== null) {
        if (!i.energy || ENERGY_RANK[i.energy as Energy] > ENERGY_RANK[energy]) return false;
      }
      return true;
    });
  }, [items, time, energy, filtering]);
  const hiddenMissing = filtering
    ? items.filter(
        (i) =>
          !matches.includes(i) &&
          ((time !== null && time !== "flex" && i.duration_minutes == null) || (energy !== null && !i.energy)),
      ).length
    : 0;

  const chosenItem = items.find((i) => i.id === chosen) ?? null;

  const surprise = () => {
    const pool = matches.filter((i) => !isDone(i));
    const list = pool.length ? pool : matches;
    if (!list.length) return;
    const others = list.length > 1 ? list.filter((i) => i.id !== chosen) : list;
    setChosen(others[Math.floor(Math.random() * others.length)]!.id);
  };

  return (
    <div className="mt-2 w-full max-w-2xl pb-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-serif text-sm text-muted-foreground">
          {menu.description || "What fits right now?"}
        </p>
        <button
          type="button"
          onClick={() => setEditingMenu(true)}
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <Pencil className="size-3.5" /> Edit menu
        </button>
      </div>

      <section className="mt-4 space-y-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div>
          <p className="mb-2 font-heading text-sm text-foreground">How much time do you have?</p>
          <div className="flex flex-wrap gap-2">
            {TIMES.map((t) => (
              <Chip
                key={t.label}
                active={time === t.v}
                onClick={() => {
                  setShowAll(false);
                  setTime(time === t.v ? null : t.v);
                }}
              >
                {t.label}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 font-heading text-sm text-foreground">How much energy do you have?</p>
          <div className="flex flex-wrap gap-2">
            {(["low", "medium", "high"] as Energy[]).map((e) => (
              <Chip
                key={e}
                active={energy === e}
                onClick={() => {
                  setShowAll(false);
                  setEnergy(energy === e ? null : e);
                }}
              >
                {e[0]!.toUpperCase() + e.slice(1)}
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={surprise}
            disabled={!matches.length}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            <Shuffle className="size-4" /> Surprise me
          </button>
          {(time !== null || energy !== null) && (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-semibold text-muted-foreground underline underline-offset-4"
            >
              {showAll ? "Use my filters" : `View all activities (${items.length})`}
            </button>
          )}
        </div>
      </section>

      {chosenItem && (
        <section className="mt-4 rounded-2xl bg-olive/10 p-4 ring-1 ring-olive/30 [animation:rise_0.25s_both]">
          <div className="flex items-start justify-between gap-2">
            <p className="font-serif text-xs italic text-muted-foreground">Doing now</p>
            <button
              type="button"
              aria-label="Clear choice"
              onClick={() => setChosen(null)}
              className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-black/5"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="font-heading text-xl text-foreground">{chosenItem.name}</p>
          <Meta i={chosenItem} />
          {chosenItem.notes && <p className="mt-2 text-sm text-muted-foreground">{chosenItem.notes}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {focusEnabled && (
              <button
                type="button"
                onClick={() =>
                  openTimer({
                    title: chosenItem.name,
                    subtitle: menu.name,
                    onComplete: () => markDone(chosenItem, true),
                  })
                }
                className="flex items-center gap-1.5 rounded-full bg-focus px-4 py-2 text-sm font-semibold text-white"
              >
                <Timer className="size-4" /> Start timer
              </button>
            )}
            <button
              type="button"
              onClick={() => markDone(chosenItem, !isDone(chosenItem))}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold",
                isDone(chosenItem) ? "bg-olive text-white" : "bg-white text-foreground ring-1 ring-border",
              )}
            >
              <Check className="size-4" /> {isDone(chosenItem) ? "Done today" : "Mark done"}
            </button>
          </div>
        </section>
      )}

      <div className="mt-5 flex items-center justify-between">
        <p className="font-heading text-sm uppercase tracking-wide text-olive">
          {filtering ? `Fits right now (${matches.length})` : `Activities (${items.length})`}
        </p>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-sm font-semibold text-primary"
        >
          <Plus className="size-4" /> Add activity
        </button>
      </div>

      {items.length === 0 ? (
        <div className="mt-3 rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
          No activities yet. Add your own, or pull in a goal step or hobby you already have.
        </div>
      ) : matches.length === 0 ? (
        <div className="mt-3 rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
          Nothing in this menu fits that time and energy.
          <div className="mt-3 flex justify-center gap-2">
            <Chip active={false} onClick={() => { setTime(null); setEnergy(null); }}>Clear filters</Chip>
            <Chip active={false} onClick={() => setShowAll(true)}>View all activities</Chip>
          </div>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {matches.map((i) => {
            const done = isDone(i);
            return (
              <li
                key={i.itemId}
                className={cn(
                  "flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm ring-1 transition-colors",
                  chosen === i.id ? "ring-olive" : "ring-border",
                )}
              >
                <button
                  type="button"
                  aria-label={done ? `Mark ${i.name} not done` : `Mark ${i.name} done`}
                  aria-pressed={done}
                  onClick={() => markDone(i, !done)}
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full ring-1 transition-colors",
                    done ? "bg-olive text-white ring-olive" : "bg-white text-transparent ring-border hover:text-black/20",
                  )}
                >
                  <Check className="size-4" strokeWidth={3} />
                </button>
                <button type="button" onClick={() => setChosen(i.id)} className="min-w-0 flex-1 text-left">
                  <span className={cn("block text-sm font-semibold", done && "text-muted-foreground line-through")}>
                    {i.name}
                  </span>
                  <Meta i={i} />
                </button>
                <button
                  type="button"
                  aria-label={`Edit ${i.name}`}
                  onClick={() => setEditing(i)}
                  className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-black/5"
                >
                  <Pencil className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {hiddenMissing > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-3 text-xs text-muted-foreground underline underline-offset-4"
        >
          {hiddenMissing} activit{hiddenMissing === 1 ? "y has" : "ies have"} no time or energy set — view all
        </button>
      )}

      {adding && <AddActivityModal menuId={menuId} existingIds={items.map((i) => i.id)} onDone={invalidate} onClose={() => setAdding(false)} />}
      {editing && (
        <EditActivityModal
          item={editing}
          onSaved={invalidate}
          onRemove={() => {
            removeMutation.mutate(editing);
            if (chosen === editing.id) setChosen(null);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
      {editingMenu && (
        <EditMenu menu={menu} onClose={() => setEditingMenu(false)} onSaved={invalidate} />
      )}
      {logHobby && (
        <AwaLogModal
          hobbies={[{ id: logHobby.id, name: logHobby.name, icon: logHobby.icon }]}
          initialHobbyId={logHobby.id}
          lockHobby
          onClose={() => setLogHobby(null)}
        />
      )}
    </div>
  );
}

function Meta({ i }: { i: Item }) {
  const d = durationText(i.duration_minutes);
  return (
    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {d && (
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" /> {d}
        </span>
      )}
      <EnergyDots energy={(i.energy as Energy | null) ?? null} />
      <span>{KIND_LABEL[(i.kind as Kind) ?? "other"] ?? "Other"}</span>
      {i.step && (
        <span className="inline-flex items-center gap-1 text-olive">
          <Target className="size-3" /> Goal step
        </span>
      )}
      {i.hobby && (
        <span className="inline-flex items-center gap-1 text-olive">
          <Armchair className="size-3" /> Hobby
        </span>
      )}
    </span>
  );
}

type AddInput = {
  menuId: string;
  activityId?: string;
  stepId?: string;
  hobbyId?: string;
  fields?: { name: string; durationMinutes: number | null; energy: Energy | null; kind: Kind; notes: string | null };
};

const emptyDraft: ActivityDraft = { name: "", durationMinutes: null, energy: null, kind: "other", notes: "" };

function AddActivityModal({
  menuId,
  existingIds,
  onDone,
  onClose,
}: {
  menuId: string;
  existingIds: string[];
  onDone: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"new" | "existing">("new");
  const [d, setD] = useState<ActivityDraft>(emptyDraft);
  const [q, setQ] = useState("");
  const sources = useQuery({
    queryKey: ["activity-sources"],
    queryFn: () => listActivitySources(),
    enabled: tab === "existing",
  });
  const add = useMutation({
    mutationFn: (v: AddInput) => addMenuActivity({ data: v }),
    onSuccess: () => onDone(),
  });

  const ql = q.trim().toLowerCase();
  const m = (s: string) => !ql || s.toLowerCase().includes(ql);
  const linkedStep = new Set((sources.data?.activities ?? []).filter((a) => existingIds.includes(a.id)).map((a) => a.step_id ?? a.hobby_id));

  return (
    <ModalShell title="Add activity" onClose={onClose}>
      <div className="mt-3 flex gap-2">
        <Chip active={tab === "new"} onClick={() => setTab("new")}>New activity</Chip>
        <Chip active={tab === "existing"} onClick={() => setTab("existing")}>From my app</Chip>
      </div>
      {add.error && <p className="mt-2 text-sm text-destructive">Couldn't add that. Please try again.</p>}
      {tab === "new" ? (
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!d.name.trim()) return;
            add.mutate(
              { menuId, fields: { ...d, notes: d.notes || null } },
              { onSuccess: () => setD(emptyDraft) },
            );
          }}
        >
          <ActivityFields d={d} setD={setD} />
          <button
            type="submit"
            disabled={add.isPending || !d.name.trim()}
            className="mt-4 w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {add.isPending ? "Adding…" : "Add to menu"}
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">The form stays open so you can add several.</p>
        </form>
      ) : sources.isPending ? (
        <Loading />
      ) : (
        <div className="mt-4 space-y-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className={inputClass} />
          <SourceGroup
            title="My menu activities"
            rows={(sources.data?.activities ?? [])
              .filter((a) => !a.step_id && !a.hobby_id && m(a.name))
              .map((a) => ({ key: a.id, label: a.name, added: existingIds.includes(a.id), onAdd: () => add.mutate({ menuId, activityId: a.id }) }))}
          />
          <SourceGroup
            title="Hobbies"
            rows={(sources.data?.hobbies ?? [])
              .filter((h) => m(h.name))
              .map((h) => ({ key: h.id, label: h.name, added: linkedStep.has(h.id), onAdd: () => add.mutate({ menuId, hobbyId: h.id }) }))}
          />
          <SourceGroup
            title="Goal steps"
            rows={(sources.data?.steps ?? [])
              .filter((s) => m(s.title) || m(s.goal?.title ?? ""))
              .map((s) => ({ key: s.id, label: s.title, sub: s.goal?.title, added: linkedStep.has(s.id), onAdd: () => add.mutate({ menuId, stepId: s.id }) }))}
          />
        </div>
      )}
    </ModalShell>
  );
}

function SourceGroup({
  title,
  rows,
}: {
  title: string;
  rows: { key: string; label: string; sub?: string | undefined; added: boolean; onAdd: () => void }[];
}) {
  const [added, setAdded] = useState<Set<string>>(new Set());
  if (!rows.length) return null;
  return (
    <div>
      <p className="mb-1.5 font-heading text-xs uppercase tracking-wide text-olive">{title}</p>
      <ul className="max-h-56 space-y-1 overflow-y-auto">
        {rows.map((r) => {
          const isAdded = r.added || added.has(r.key);
          return (
            <li key={r.key} className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 ring-1 ring-border">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{r.label}</span>
                {r.sub && <span className="block truncate text-xs text-muted-foreground">{r.sub}</span>}
              </span>
              <button
                type="button"
                disabled={isAdded}
                onClick={() => {
                  r.onAdd();
                  setAdded((s) => new Set(s).add(r.key));
                }}
                className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold disabled:bg-olive disabled:text-white"
              >
                {isAdded ? "Added" : "Add"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EditActivityModal({
  item,
  onSaved,
  onRemove,
  onClose,
}: {
  item: Item;
  onSaved: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const [d, setD] = useState<ActivityDraft>({
    name: item.name,
    durationMinutes: item.duration_minutes,
    energy: (item.energy as Energy | null) ?? null,
    kind: (item.kind as Kind) ?? "other",
    notes: item.notes ?? "",
  });
  const save = useMutation({
    mutationFn: () => updateMenuActivity({ data: { id: item.id, ...d, notes: d.notes || null } }),
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });
  const linked = item.step || item.hobby;
  return (
    <ModalShell title="Edit activity" onClose={onClose}>
      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (d.name.trim()) save.mutate();
        }}
      >
        <ActivityFields d={d} setD={setD} />
        <p className="mt-3 text-xs text-muted-foreground">
          Changes show in every menu this activity is in.
          {linked && " Your original goal step or hobby isn't changed."}
        </p>
        {save.error && <p className="mt-2 text-sm text-destructive">Couldn't save. Please try again.</p>}
        <button
          type="submit"
          disabled={save.isPending || !d.name.trim()}
          className="mt-4 w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {save.isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="mt-2 w-full rounded-2xl bg-muted py-3 text-sm font-semibold text-foreground"
        >
          Remove from this menu
        </button>
      </form>
    </ModalShell>
  );
}

function EditMenu({
  menu,
  onClose,
  onSaved,
}: {
  menu: NonNullable<Awaited<ReturnType<typeof getMenu>>>["menu"];
  onClose: () => void;
  onSaved: () => void;
}) {
  const save = useMutation({
    mutationFn: (d: { name: string; description: string; category: string; icon: string | null }) =>
      saveMenu({ data: { ...d, id: menu.id } }),
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });
  return (
    <MenuFormModal
      title="Edit menu"
      initial={{ name: menu.name, description: menu.description ?? "", category: menu.category ?? "", icon: menu.icon }}
      saving={save.isPending}
      onSave={(d) => save.mutate(d)}
      onClose={onClose}
    />
  );
}
