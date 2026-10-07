import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { localToday } from "@/components/goal-ui";
import { addAwaLog, updateAwaLog } from "@/lib/awa.functions";
import { cn } from "@/lib/utils";

export type AwaHobby = { id: string; name: string; icon: string | null };
export type AwaEditLog = {
  id: string;
  hobby_id: string | null;
  logged_on: string;
  activity_time: string | null;
  note: string | null;
};

/** "18:30" -> "6:30 PM". Passes other formats through unchanged. */
export function formatAwaTime(t: string | null): string {
  if (!t) return "";
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return t;
  let h = Number(m[1]);
  const min = m[2];
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${min} ${ampm}`;
}

/**
 * Log (or edit) a hobby activity. With `editLog` it updates; otherwise it adds.
 * `lockHobby` hides the hobby picker (used from a single hobby's view).
 */
export function AwaLogModal({
  hobbies,
  initialHobbyId,
  lockHobby = false,
  editLog,
  prefillNote,
  onAddHobby,
  onClose,
}: {
  hobbies: AwaHobby[];
  initialHobbyId?: string | undefined;
  lockHobby?: boolean;
  editLog?: AwaEditLog | undefined;
  prefillNote?: string | undefined;
  onAddHobby?: (() => void) | undefined;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [hobbyId, setHobbyId] = useState<string | null>(
    editLog?.hobby_id ?? initialHobbyId ?? hobbies[0]?.id ?? null,
  );
  const [date, setDate] = useState(editLog?.logged_on ?? localToday());
  const [time, setTime] = useState(editLog?.activity_time ?? "");
  const [note, setNote] = useState(editLog?.note ?? prefillNote ?? "");
  const [err, setErr] = useState<string | null>(null);

  const selected = hobbies.find((h) => h.id === hobbyId);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);

  const save = useMutation({
    mutationFn: async () => {
      if (editLog) {
        await updateAwaLog({
          data: {
            id: editLog.id,
            loggedOn: date,
            activityTime: time || null,
            note: note.trim() || null,
          },
        });
      } else {
        await addAwaLog({
          data: {
            ...(selected ? { hobbyId: selected.id } : {}),
            hobbyName: selected?.name ?? "Activity",
            ...(selected?.icon ? { hobbyIcon: selected.icon } : {}),
            ...(time ? { activityTime: time } : {}),
            ...(note.trim() ? { note: note.trim() } : {}),
            loggedOn: date,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awa-logs"] });
      onClose();
    },
    onError: (e) =>
      setErr(e instanceof Error ? e.message : "Couldn't save that activity."),
  });

  const canSave = (!!editLog || !!selected) && validDate && !save.isPending;
  const showPicker = !lockHobby && !editLog;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-6 shadow-xl [animation:rise_0.25s_both] sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl leading-none text-black">
            {editLog ? "Edit activity" : "Log it"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black"
          >
            <X className="size-5" />
          </button>
        </div>

        {showPicker && hobbies.length === 0 ? (
          <div className="mt-6 text-center">
            <p className="font-serif text-sm text-black/50">
              Add a hobby to your shelf first, then you can log it.
            </p>
            {onAddHobby && (
              <button
                type="button"
                onClick={onAddHobby}
                className="mt-4 rounded-2xl bg-olive px-5 py-3 font-heading text-sm uppercase text-white transition-colors hover:bg-olive/90"
              >
                Go to shelf
              </button>
            )}
          </div>
        ) : (
          <>
            {showPicker && (
              <>
                <p className="mt-6 font-heading text-sm uppercase text-olive">Hobby</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {hobbies.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setHobbyId(h.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-serif text-sm transition-colors",
                        hobbyId === h.id
                          ? "bg-olive text-white"
                          : "bg-white text-black/70 shadow-sm hover:bg-white/70",
                      )}
                    >
                      <span>{h.icon || "🌿"}</span>
                      {h.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="mt-6 font-heading text-sm uppercase text-olive">Date</p>
            <input
              type="date"
              value={date}
              max={localToday()}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 w-full rounded-2xl bg-black/5 px-4 py-3 font-serif text-base focus:outline-none focus:ring-1 focus:ring-olive/40"
            />

            <p className="mt-6 font-heading text-sm uppercase text-olive">
              Time <span className="text-black/35">(optional)</span>
            </p>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-2 w-full rounded-2xl bg-black/5 px-4 py-3 font-serif text-base focus:outline-none focus:ring-1 focus:ring-olive/40"
            />

            <p className="mt-6 font-heading text-sm uppercase text-olive">
              What did you do? <span className="text-black/35">(optional)</span>
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Drew for 30 minutes and finished the little house…"
              className="mt-2 w-full resize-y rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm leading-relaxed placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
            />

            {err && (
              <p className="mt-4 rounded-xl bg-clay-deep/10 px-3 py-2 font-serif text-sm text-clay-deep">
                {err}
              </p>
            )}
            <button
              type="button"
              onClick={() => canSave && save.mutate()}
              disabled={!canSave}
              className="mt-6 w-full rounded-2xl bg-olive py-3.5 font-heading text-sm uppercase text-white shadow-sm transition-colors hover:bg-olive/90 disabled:opacity-40"
            >
              {save.isPending ? "Saving…" : editLog ? "Save changes" : "Save"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
