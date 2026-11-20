import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/artwork-modal";
import { Stamp } from "@/components/stamp";
import { type Accent } from "@/components/goal-ui";
import { StampStyleEditor } from "@/components/stamp-style-editor";
import { WinFormModal, winStampStyle, type EditableWin } from "@/components/win-form-modal";
import { goalsQueryOptions, stampsQueryOptions, winsQueryOptions } from "@/lib/goal-queries";
import { updateStamp } from "@/lib/stamps.functions";
import { updateGoalDetails } from "@/lib/goals.functions";
import { mergeStamps, type StampView } from "@/lib/stamp-view";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/gallery")({
  head: () => ({ meta: [
    { title: "My Moongrove — completed goals & wins" },
    { name: "description", content: "Your completed goals and personal wins, kept together in My Moongrove." },
    { property: "og:title", content: "My Moongrove — completed goals & wins" },
    { property: "og:description", content: "Look back on completed goals and celebrate the wins you log." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: GalleryPage,
});

type GalleryGoal = {
  id: string; title: string; accent: string; icon: string | null;
  why: string | null; vision: string | null;
  steps: { id: string; title: string; done: boolean }[];
};

function GalleryPage() {
  const queryClient = useQueryClient();
  const { data: goals } = useQuery(goalsQueryOptions);
  const { data: stamps } = useQuery(stampsQueryOptions);
  const { data: wins } = useQuery(winsQueryOptions);
  const [adding, setAdding] = useState(false);
  const [editingWin, setEditingWin] = useState<EditableWin | null>(null);
  const [detailGoal, setDetailGoal] = useState<{ stamp: StampView; goal?: GalleryGoal | undefined } | null>(null);
  const goalStamps = mergeStamps(stamps, goals);
  const saveStyle = useMutation({
    mutationFn: async ({ stamp, icon, accent }: { stamp: StampView; icon: string | null; accent: string }) => {
      if (stamp.stampId) return updateStamp({ data: { id: stamp.stampId, icon: icon ?? undefined, accent } });
      if (!stamp.goalId) throw new Error("This completed goal is no longer available.");
      return updateGoalDetails({ data: { id: stamp.goalId, title: stamp.title, icon: icon ?? "", accent: accent as Accent } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stamps"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setDetailGoal(null);
    },
  });
  return (
    <AppShell title="My Moongrove">
      <div className="mt-6 space-y-8">
        <section>
          <h2 className="font-heading text-base text-foreground">Completed goals <span className="ml-2 text-sm text-muted-foreground">{goalStamps.length}</span></h2>
          {goalStamps.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Your completed goals will be kept here.</p> : (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {goalStamps.map((stamp) => (
                <Button key={stamp.key} variant="ghost" aria-label={`Goal: ${stamp.title}`}
                  onClick={() => setDetailGoal({ stamp, goal: goals?.find((goal) => goal.id === stamp.goalId) })}
                  className="h-auto min-w-0 flex-col gap-3 whitespace-normal py-4 text-center">
                  <Stamp icon={stamp.icon} accent={stamp.accent} className="size-20! shrink-0" />
                  <span className="w-full font-heading text-sm leading-snug [overflow-wrap:anywhere]">{stamp.title}</span>
                </Button>
              ))}
            </div>
          )}
        </section>
        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-base text-foreground">Logged wins <span className="ml-2 text-sm text-muted-foreground">{wins?.length ?? 0}</span></h2>
            <Button onClick={() => setAdding(true)} size="sm"><Plus className="size-4" />Log a win</Button>
          </div>
          {!wins?.length ? <p className="mt-4 text-sm text-muted-foreground">No wins logged yet.</p> : (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {wins.map((win) => {
                const style = winStampStyle(win.kind, win.icon, win.accent);
                return (
                  <Button key={win.id} variant="ghost" aria-label={`Win: ${win.title}`}
                    onClick={() => setEditingWin(win)}
                    className="h-auto min-w-0 flex-col gap-3 whitespace-normal py-4 text-center">
                    <Stamp icon={style.icon} accent={style.accent} className="size-20! shrink-0" />
                    <span className="w-full font-heading text-sm leading-snug [overflow-wrap:anywhere]">{win.title}</span>
                    <span className="text-xs text-muted-foreground">{new Date(`${win.achieved_on}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
                  </Button>
                );
              })}
            </div>
          )}
        </section>
      </div>
      {adding && <WinFormModal onClose={() => setAdding(false)} />}
      {editingWin && <WinFormModal win={editingWin} onClose={() => setEditingWin(null)} />}
      {detailGoal && <GoalInfoModal stamp={detailGoal.stamp} goal={detailGoal.goal} saving={saveStyle.isPending}
        onSave={(icon, accent) => saveStyle.mutate({ stamp: detailGoal.stamp, icon, accent })}
        onClose={() => setDetailGoal(null)} />}
    </AppShell>
  );
}

function GoalInfoModal({
  stamp,
  goal,
  saving,
  onSave,
  onClose,
}: {
  stamp: StampView;
  goal?: GalleryGoal | undefined;
  saving: boolean;
  onSave: (icon: string | null, accent: string) => void;
  onClose: () => void;
}) {
  const [icon, setIcon] = useState<string | null>(stamp.icon);
  const [accent, setAccent] = useState<string>(stamp.accent);
  const dirty = icon !== stamp.icon || accent !== stamp.accent;

  const steps = goal?.steps ?? [];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <ModalShell title="Completed dream" onClose={onClose}>
      <div className="mt-2 flex flex-col items-center gap-3 text-center">
        <Stamp icon={icon} accent={accent} className="size-24" />
        <p className="font-display text-2xl leading-tight text-foreground">
          {stamp.title}
        </p>
        <p className="flex items-center gap-1.5 font-serif text-sm text-muted-foreground">
          <Check className="size-4 text-foreground" strokeWidth={2.5} /> Completed
        </p>
      </div>

      {/* Recolour / re-icon */}
      <div className="mt-5">
        <StampStyleEditor
          icon={icon}
          accent={accent}
          onIcon={setIcon}
          onAccent={setAccent}
        />
        <Button
          type="button"
          onClick={() => onSave(icon, accent)}
          disabled={!dirty || saving}
          className="mt-4 w-full rounded-2xl bg-primary py-3 font-heading text-sm text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save look"}
        </Button>
      </div>

      {goal?.why?.trim() && (
        <section className="mt-5">
          <p className="font-heading text-sm text-foreground">
            Why I did this
          </p>
          <p className="mt-1 whitespace-pre-wrap font-serif text-sm leading-relaxed text-muted-foreground">
            {goal.why}
          </p>
        </section>
      )}

      {goal?.vision?.trim() && (
        <section className="mt-4">
          <p className="font-heading text-sm text-foreground">
            What it looked like when done
          </p>
          <p className="mt-1 whitespace-pre-wrap font-serif text-sm leading-relaxed text-muted-foreground">
            {goal.vision}
          </p>
        </section>
      )}

      {steps.length > 0 && (
        <section className="mt-4">
          <p className="font-heading text-sm text-foreground">
            Steps
            <span className="ml-1.5 font-mono text-xs text-muted-foreground">
              {doneCount}/{steps.length}
            </span>
          </p>
          <ul className="mt-2 space-y-1.5">
            {steps.map((st) => (
              <li key={st.id} className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-md",
                    st.done
                      ? "bg-primary text-primary-foreground"
                      : "border-2 border-border",
                  )}
                >
                  {st.done && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span
                  className={cn(
                    "font-serif text-sm",
                    st.done
                      ? "text-muted-foreground line-through decoration-border"
                      : "text-foreground",
                  )}
                >
                  {st.title}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </ModalShell>
  );
}
