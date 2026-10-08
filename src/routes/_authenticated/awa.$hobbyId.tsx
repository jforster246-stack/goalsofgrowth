import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Loading } from "@/components/loading";
import { AwaLogModal, formatAwaTime, type AwaEditLog } from "@/components/awa-log-modal";
import { AwaHobbyModal } from "@/components/awa-hobby-modal";
import {
  HobbyIcon,
  durationLabel,
  hobbyAccent,
  longDate,
  useAwaPhotoUrls,
  type AwaHobby,
  type AwaLog,
} from "@/components/awa-ui";
import { awaHobbiesQueryOptions, awaLogsQueryOptions } from "@/lib/goal-queries";
import { setAwaHobbyPutAway } from "@/lib/awa.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/awa/$hobbyId")({
  head: () => ({ meta: [{ title: "A While Away — Goals of Growth" }] }),
  component: HobbyPage,
});

function HobbyPage() {
  const { hobbyId } = Route.useParams();
  return <HobbyView hobbyId={hobbyId} />;
}

export function HobbyView({ hobbyId }: { hobbyId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: hobbies, isPending } = useQuery(awaHobbiesQueryOptions);
  const { data: logs } = useQuery(awaLogsQueryOptions);
  const [logging, setLogging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editLog, setEditLog] = useState<AwaLog | null>(null);

  const hobby = ((hobbies ?? []) as AwaHobby[]).find((h) => h.id === hobbyId);
  const history = ((logs ?? []) as AwaLog[]).filter((l) => l.hobby_id === hobbyId);
  const photoUrls = useAwaPhotoUrls(history.map((l) => l.photo_path));

  const bringBack = useMutation({
    mutationFn: () => setAwaHobbyPutAway({ data: { id: hobbyId, putAway: false } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["awa-hobbies"] }),
  });

  if (isPending) {
    return (
      <AppShell backTo="/awa" title="A While Away" hideSettings>
        <Loading />
      </AppShell>
    );
  }

  if (!hobby) {
    return (
      <AppShell backTo="/awa" title="A While Away" hideSettings>
        <div className="mt-10 text-center">
          <p className="font-serif text-sm text-black/55">This hobby isn't on your shelf.</p>
          <Link
            to="/awa"
            className="mt-4 inline-block rounded-2xl bg-olive px-5 py-3 font-heading text-sm uppercase text-white"
          >
            Back to the shelf
          </Link>
        </div>
      </AppShell>
    );
  }

  const style = hobbyAccent(hobby.accent);
  const count = history.length;

  return (
    <AppShell backTo="/awa" title={hobby.name} hideSettings>
      <div className="mt-4 w-full space-y-6 pb-4 md:mx-auto md:max-w-xl">
        {/* Header */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div
            className={cn(
              "flex items-end justify-between gap-3 px-5 py-6 text-white",
              style.surface,
            )}
          >
            <HobbyIcon icon={hobby.icon} className="size-14 text-5xl" />
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Edit hobby"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
            >
              <Pencil className="size-4" />
            </button>
          </div>
          <div className="px-5 py-4">
            {hobby.description && (
              <p className="font-serif text-sm text-black/65">{hobby.description}</p>
            )}
            <p className={cn("font-heading text-sm", style.text, hobby.description && "mt-2")}>
              {count === 0 ? "Waiting for you" : `${count} ${count === 1 ? "time" : "times"}`}
            </p>
          </div>
        </div>

        {hobby.archived_at ? (
          <div className="rounded-2xl bg-black/5 px-4 py-3 text-center">
            <p className="font-serif text-sm text-black/60">This hobby is put away for now.</p>
            <button
              type="button"
              onClick={() => bringBack.mutate()}
              className="mt-2 rounded-full bg-olive px-4 py-2 font-heading text-xs uppercase text-white"
            >
              Bring it back to the shelf
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setLogging(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-olive py-3.5 font-heading text-sm uppercase text-white shadow-sm transition-colors hover:bg-olive/90"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Log a little time
          </button>
        )}

        {/* Diary */}
        {count === 0 ? (
          <div className="rounded-3xl bg-white/60 px-6 py-8 text-center">
            <p className="font-display text-2xl text-black">Nothing here yet.</p>
            <p className="mx-auto mt-2 max-w-xs font-serif text-sm text-black/55">
              Whenever you spend a little time doing this, come back and keep a record.
            </p>
            {!hobby.archived_at && (
              <button
                type="button"
                onClick={() => setLogging(true)}
                className="mt-4 font-heading text-xs uppercase text-olive underline-offset-4 hover:underline"
              >
                Log something
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((l) => {
              const when =
                durationLabel(l.duration) ??
                (l.activity_time ? formatAwaTime(l.activity_time) : null);
              const photo = l.photo_path ? photoUrls[l.photo_path] : undefined;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setEditLog(l)}
                  className="block w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm transition-colors hover:bg-white/80"
                >
                  {photo && <img src={photo} alt="" className="max-h-80 w-full object-cover" />}
                  <span className="block px-4 py-3">
                    <span className="block font-heading text-xs uppercase tracking-wide text-black/55">
                      {longDate(l.logged_on)}
                    </span>
                    {when && (
                      <span className="mt-0.5 block font-serif text-xs text-black/40">{when}</span>
                    )}
                    {l.note && (
                      <span className="mt-1.5 block font-serif text-sm leading-relaxed text-black/75">
                        {l.note}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {logging && (
        <AwaLogModal
          hobbies={[hobby]}
          initialHobbyId={hobby.id}
          lockHobby
          onClose={() => setLogging(false)}
        />
      )}
      {editLog && (
        <AwaLogModal
          hobbies={[hobby]}
          lockHobby
          editLog={editLog as AwaEditLog}
          onClose={() => setEditLog(null)}
        />
      )}
      {editing && (
        <AwaHobbyModal
          hobby={hobby}
          onClose={() => setEditing(false)}
          onPutAway={() => navigate({ to: "/awa" })}
        />
      )}
    </AppShell>
  );
}
