import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { GOAL_ACCENTS, type Accent } from "@/components/goal-ui";
import { IconPicker } from "@/components/icon-picker";
import { HobbyIcon, hobbyAccent, type AwaHobby } from "@/components/awa-ui";
import { addAwaHobby, setAwaHobbyPutAway, updateAwaHobby } from "@/lib/awa.functions";
import { cn } from "@/lib/utils";

const fieldClass =
  "mt-2 w-full rounded-2xl bg-black/5 px-4 py-3 font-serif text-sm placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-olive/40";

const isMotifId = (icon: string | null) => !!icon && /^m\d{3}$/.test(icon);

/** Add a hobby to the shelf, or edit one (with "Put away" instead of delete). */
export function AwaHobbyModal({
  hobby,
  onClose,
  onPutAway,
}: {
  hobby?: AwaHobby | undefined;
  onClose: () => void;
  onPutAway?: (() => void) | undefined;
}) {
  const queryClient = useQueryClient();
  const editing = !!hobby;
  const [name, setName] = useState(hobby?.name ?? "");
  const [description, setDescription] = useState(hobby?.description ?? "");
  const [icon, setIcon] = useState<string | null>(hobby?.icon ?? null);
  const [accent, setAccent] = useState<Accent>((hobby?.accent as Accent) || "mint");
  const [err, setErr] = useState<string | null>(null);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["awa-hobbies"] });
    await queryClient.invalidateQueries({ queryKey: ["awa-logs"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const trimmedIcon = icon?.trim() || null;
      if (editing) {
        await updateAwaHobby({
          data: {
            id: hobby!.id,
            name: name.trim(),
            icon: trimmedIcon,
            description: description.trim() || null,
            accent,
          },
        });
      } else {
        await addAwaHobby({
          data: {
            name: name.trim(),
            ...(trimmedIcon ? { icon: trimmedIcon } : {}),
            ...(description.trim() ? { description: description.trim() } : {}),
            accent,
          },
        });
      }
    },
    onSuccess: async () => {
      await refresh();
      onClose();
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "Couldn't save that hobby."),
  });

  const putAway = useMutation({
    mutationFn: () => setAwaHobbyPutAway({ data: { id: hobby!.id, putAway: true } }),
    onSuccess: async () => {
      await refresh();
      onClose();
      onPutAway?.();
    },
  });

  const style = hobbyAccent(accent);
  const canSave = name.trim().length > 0 && !save.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (canSave) save.mutate();
        }}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-6 shadow-xl [animation:rise_0.25s_both] sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl leading-none text-black">
            {editing ? "Edit hobby" : "Add a hobby"}
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

        {/* Live preview of the shelf card */}
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <span
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-2xl text-2xl text-white",
              style.surface,
            )}
          >
            <HobbyIcon icon={icon} className="size-7" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-heading text-sm text-black">
              {name.trim() || "Your hobby"}
            </span>
            <span className="block truncate font-serif text-xs text-black/45">
              {description.trim() || "A few words about it"}
            </span>
          </span>
        </div>

        <label className="mt-5 block">
          <span className="font-heading text-sm uppercase text-olive">Hobby</span>
          <input
            autoFocus={!editing}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Drawing"
            maxLength={80}
            className={fieldClass}
          />
        </label>

        <label className="mt-5 block">
          <span className="flex items-baseline justify-between">
            <span className="font-heading text-sm uppercase text-olive">A few words</span>
            <span className="font-serif text-xs italic text-black/40">optional</span>
          </span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Making things just because I want to."
            maxLength={200}
            className={fieldClass}
          />
        </label>

        <p className="mt-5 font-heading text-sm uppercase text-olive">Colour</p>
        <div className="mt-2 flex gap-3">
          {GOAL_ACCENTS.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setAccent(a.key)}
              aria-label={a.label}
              aria-pressed={accent === a.key}
              className={cn(
                "grid size-10 place-items-center rounded-full text-white transition-transform",
                a.swatch,
                accent === a.key ? "ring-2 ring-black/40 ring-offset-2 ring-offset-background" : "",
              )}
            >
              {accent === a.key && <Check className="size-4" strokeWidth={2.5} />}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-baseline justify-between">
          <p className="font-heading text-sm uppercase text-olive">Icon</p>
          <label className="flex items-center gap-2 font-serif text-xs text-black/45">
            or an emoji
            <input
              value={icon && !isMotifId(icon) ? icon : ""}
              onChange={(e) => setIcon(e.target.value.slice(0, 8) || null)}
              placeholder="🎨"
              aria-label="Emoji"
              className="w-12 rounded-xl bg-black/5 px-2 py-1.5 text-center text-base focus:outline-none focus:ring-1 focus:ring-olive/40"
            />
          </label>
        </div>
        <div className="mt-2">
          <IconPicker
            value={isMotifId(icon) ? icon : null}
            onChange={setIcon}
            defaultLabel="Sprout"
          />
        </div>

        {err && (
          <p className="mt-4 rounded-xl bg-clay-deep/10 px-3 py-2 font-serif text-sm text-clay-deep">
            {err}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSave}
          className="mt-7 w-full rounded-2xl bg-olive py-3.5 font-heading text-sm uppercase text-white shadow-sm transition-colors hover:bg-olive/90 disabled:opacity-40"
        >
          {save.isPending ? "Saving…" : editing ? "Save" : "Add to my shelf"}
        </button>

        {editing && (
          <>
            <button
              type="button"
              onClick={() => putAway.mutate()}
              disabled={putAway.isPending}
              className="mt-2 w-full rounded-2xl py-3 font-heading text-sm uppercase text-black/50 transition-colors hover:bg-black/5 disabled:opacity-40"
            >
              {putAway.isPending ? "Putting away…" : "Put away"}
            </button>
            <p className="text-center font-serif text-xs text-black/40">
              Takes it off your shelf but keeps all its memories. You can bring it back any time.
            </p>
          </>
        )}
      </form>
    </div>
  );
}
