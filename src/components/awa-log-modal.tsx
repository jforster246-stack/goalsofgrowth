import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, ChevronDown, X } from "lucide-react";
import { localToday } from "@/components/goal-ui";
import {
  DURATIONS,
  HobbyIcon,
  friendlyDate,
  removeAwaPhoto,
  uploadAwaPhoto,
  useAwaPhotoUrls,
  type AwaHobby,
  type Duration,
} from "@/components/awa-ui";
import { addAwaLog, deleteAwaLog, updateAwaLog } from "@/lib/awa.functions";
import { cn } from "@/lib/utils";

export type { AwaHobby } from "@/components/awa-ui";
export type AwaEditLog = {
  id: string;
  hobby_id: string | null;
  hobby_name?: string;
  logged_on: string;
  activity_time: string | null;
  duration?: string | null;
  note: string | null;
  photo_path?: string | null;
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

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const chip = (active: boolean) =>
  cn(
    "rounded-full px-4 py-2 font-heading text-xs uppercase transition-colors",
    active ? "bg-olive text-white" : "bg-black/5 text-black/55 hover:bg-black/10",
  );

/**
 * Log (or edit) a little time spent on a hobby. Built to be quick: pick the
 * day (defaults to today) and save. Note, duration and photo sit under
 * "Add more". `lockHobby` hides the hobby picker.
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
  const today = localToday();
  const [hobbyId, setHobbyId] = useState<string | null>(
    editLog?.hobby_id ?? initialHobbyId ?? (hobbies.length === 1 ? hobbies[0]!.id : null),
  );
  const [date, setDate] = useState(editLog?.logged_on ?? today);
  const [pickingDate, setPickingDate] = useState(
    !!editLog && editLog.logged_on !== today && editLog.logged_on !== yesterday(),
  );
  const [more, setMore] = useState(!!editLog || !!prefillNote);
  const [note, setNote] = useState(editLog?.note ?? prefillNote ?? "");
  const [duration, setDuration] = useState<Duration | null>(
    (editLog?.duration as Duration | null | undefined) ?? null,
  );
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [keepPhoto, setKeepPhoto] = useState(!!editLog?.photo_path);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const existingUrls = useAwaPhotoUrls([editLog?.photo_path]);
  const existingUrl = editLog?.photo_path ? existingUrls[editLog.photo_path] : undefined;

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const selected = hobbies.find((h) => h.id === hobbyId);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today;

  const save = useMutation({
    mutationFn: async () => {
      const newPath = photo ? await uploadAwaPhoto(photo) : null;
      const oldPath = editLog?.photo_path ?? null;
      if (editLog) {
        const photoPath = newPath ?? (keepPhoto ? oldPath : null);
        await updateAwaLog({
          data: {
            id: editLog.id,
            loggedOn: date,
            note: note.trim() || null,
            duration,
            photoPath,
          },
        });
        if (oldPath && oldPath !== photoPath) await removeAwaPhoto(oldPath);
      } else {
        await addAwaLog({
          data: {
            ...(selected ? { hobbyId: selected.id } : {}),
            hobbyName: selected?.name ?? "Something I enjoyed",
            ...(selected?.icon ? { hobbyIcon: selected.icon } : {}),
            ...(note.trim() ? { note: note.trim() } : {}),
            ...(duration ? { duration } : {}),
            ...(newPath ? { photoPath: newPath } : {}),
            loggedOn: date,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awa-logs"] });
      if (editLog) {
        onClose();
        return;
      }
      setSavedName(selected?.name ?? "your");
      setTimeout(onClose, 1400);
    },
    onError: (e) =>
      setErr(e instanceof Error ? e.message : "Couldn't save that. Please try again."),
  });

  const remove = useMutation({
    mutationFn: async () => {
      await deleteAwaLog({ data: { id: editLog!.id } });
      if (editLog?.photo_path) await removeAwaPhoto(editLog.photo_path);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awa-logs"] });
      onClose();
    },
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canSave = (!!editLog || !!selected) && validDate && !save.isPending;
  const showPicker = !lockHobby && !editLog;
  const shownPhoto = photoPreview ?? (keepPhoto ? existingUrl : undefined);
  const hasPhoto = !!photo || (keepPhoto && !!editLog?.photo_path);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-6 shadow-xl [animation:rise_0.25s_both] sm:rounded-3xl"
      >
        {savedName ? (
          <div className="py-8 text-center">
            <HobbyIcon icon={selected?.icon} className="mx-auto size-10 text-3xl text-olive" />
            <p className="mt-4 font-display text-2xl text-black">Nice.</p>
            <p className="mt-1 font-serif text-sm text-black/55">
              Added to your {savedName.toLowerCase()} memories.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl leading-none text-black">
                {editLog
                  ? "Edit memory"
                  : lockHobby && selected
                    ? selected.name
                    : "Log a little time"}
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
                  Add a hobby to your shelf first, then you can keep a record of it.
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
                    <p className="mt-6 font-heading text-sm uppercase text-olive">
                      What did you spend time on?
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {hobbies.map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => setHobbyId(h.id)}
                          aria-pressed={hobbyId === h.id}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-serif text-sm transition-colors",
                            hobbyId === h.id
                              ? "bg-olive text-white"
                              : "bg-white text-black/70 shadow-sm hover:bg-white/70",
                          )}
                        >
                          <HobbyIcon icon={h.icon} className="size-4 text-base" />
                          {h.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <p className="mt-6 font-heading text-sm uppercase text-olive">When</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDate(today);
                      setPickingDate(false);
                    }}
                    className={chip(!pickingDate && date === today)}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDate(yesterday());
                      setPickingDate(false);
                    }}
                    className={chip(!pickingDate && date === yesterday())}
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickingDate(true)}
                    className={chip(pickingDate)}
                  >
                    {pickingDate && date !== today && date !== yesterday()
                      ? friendlyDate(date, today)
                      : "Another day"}
                  </button>
                </div>
                {pickingDate && (
                  <input
                    type="date"
                    aria-label="Date"
                    value={date}
                    max={today}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-3 w-full rounded-2xl bg-black/5 px-4 py-3 font-serif text-base focus:outline-none focus:ring-1 focus:ring-olive/40"
                  />
                )}

                {!more ? (
                  <button
                    type="button"
                    onClick={() => setMore(true)}
                    className="mt-6 inline-flex items-center gap-1 font-heading text-xs uppercase text-black/45 transition-colors hover:text-olive"
                  >
                    <ChevronDown className="size-4" />
                    Add a note, photo or how long
                  </button>
                ) : (
                  <>
                    <p className="mt-6 font-heading text-sm uppercase text-olive">
                      What did you get up to?{" "}
                      <span className="font-serif text-xs normal-case italic text-black/35">
                        optional
                      </span>
                    </p>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder="What did you get up to?"
                      className="mt-2 w-full resize-y rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm leading-relaxed placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40"
                    />

                    <p className="mt-5 font-heading text-sm uppercase text-olive">
                      How long?{" "}
                      <span className="font-serif text-xs normal-case italic text-black/35">
                        optional
                      </span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {DURATIONS.map((d) => (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => setDuration(duration === d.key ? null : d.key)}
                          aria-pressed={duration === d.key}
                          className={chip(duration === d.key)}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>

                    <p className="mt-5 font-heading text-sm uppercase text-olive">
                      Photo{" "}
                      <span className="font-serif text-xs normal-case italic text-black/35">
                        optional
                      </span>
                    </p>
                    <input
                      ref={fileInput}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setPhoto(f);
                        e.target.value = "";
                      }}
                    />
                    {hasPhoto ? (
                      <div className="relative mt-2 overflow-hidden rounded-2xl bg-black/5">
                        {shownPhoto ? (
                          <img src={shownPhoto} alt="" className="max-h-64 w-full object-cover" />
                        ) : (
                          <div className="h-40" />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setPhoto(null);
                            setKeepPhoto(false);
                          }}
                          aria-label="Remove photo"
                          className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-olive/35 py-4 font-heading text-xs uppercase text-olive transition-colors hover:bg-olive/5"
                      >
                        <Camera className="size-4" />
                        Add a photo
                      </button>
                    )}
                  </>
                )}

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
                  {save.isPending ? "Saving…" : "Save"}
                </button>
                {editLog && (
                  <button
                    type="button"
                    onClick={() => (confirmDelete ? remove.mutate() : setConfirmDelete(true))}
                    disabled={remove.isPending}
                    className="mt-2 w-full rounded-2xl py-3 font-heading text-sm uppercase text-clay-deep transition-colors hover:bg-clay/10 disabled:opacity-40"
                  >
                    {remove.isPending
                      ? "Deleting…"
                      : confirmDelete
                        ? "Tap again to delete"
                        : "Delete this memory"}
                  </button>
                )}
                {showPicker && !selected && (
                  <p className="mt-2 text-center font-serif text-xs text-black/40">
                    Pick a hobby above to save.
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
