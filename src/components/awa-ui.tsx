import { useQuery } from "@tanstack/react-query";
import { ACCENT_STYLES, type Accent } from "@/components/goal-ui";
import { Motif } from "@/components/motif-icons";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/* Shared types, wording and helpers for A While Away. */

export type AwaHobby = {
  id: string;
  name: string;
  icon: string | null;
  description?: string | null;
  accent?: string | null;
  archived_at?: string | null;
  created_at?: string;
  position?: number;
};

export type AwaLog = {
  id: string;
  hobby_id: string | null;
  hobby_name: string;
  hobby_icon: string | null;
  activity_time: string | null;
  duration?: string | null;
  note: string | null;
  photo_path?: string | null;
  logged_on: string;
  created_at?: string;
};

export type Duration = "little" | "hour" | "afternoon" | "day";

export const DURATIONS: { key: Duration; label: string }[] = [
  { key: "little", label: "A little while" },
  { key: "hour", label: "An hour or so" },
  { key: "afternoon", label: "An afternoon" },
  { key: "day", label: "All day" },
];

export function durationLabel(d: string | null | undefined) {
  return DURATIONS.find((x) => x.key === d)?.label ?? null;
}

/** The motif shown when a hobby has no icon (a little sprouting tree). */
const DEFAULT_MOTIF = "m010";

const isMotifId = (icon: string | null | undefined) => !!icon && /^m\d{3}$/.test(icon);

/** A hobby's icon: a motif from the pack, an emoji, or the default motif. */
export function HobbyIcon({
  icon,
  className,
}: {
  icon: string | null | undefined;
  className?: string;
}) {
  if (icon && !isMotifId(icon)) {
    return (
      <span className={cn("leading-none", className)} aria-hidden>
        {icon}
      </span>
    );
  }
  return <Motif id={icon || DEFAULT_MOTIF} {...(className ? { className } : {})} />;
}

export function hobbyAccent(accent: string | null | undefined) {
  return ACCENT_STYLES[(accent as Accent) || "mint"] ?? ACCENT_STYLES.mint;
}

export function longDate(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function shortDate(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

/** Today / Yesterday / "6 Oct" for a yyyy-mm-dd date. */
export function friendlyDate(d: string, today: string) {
  if (d === today) return "Today";
  const y = new Date(`${today}T00:00:00`);
  y.setDate(y.getDate() - 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (d === `${y.getFullYear()}-${pad(y.getMonth() + 1)}-${pad(y.getDate())}`) {
    return "Yesterday";
  }
  return longDate(d);
}

/* ------------------------------- Photos ------------------------------- */

const BUCKET = "awa-photos";
const MAX_EDGE = 1600;

/** Shrinks a photo to ~1600px JPEG; falls back to the original if it can't decode. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (blob) return blob;
  } catch {
    // Fall through and upload the original.
  }
  return file;
}

/** Uploads a photo to the user's own folder and returns its storage path. */
export async function uploadAwaPhoto(file: File): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Please sign in again to add a photo.");
  const body = await shrink(file);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, { contentType: body.type || "image/jpeg" });
  if (error) throw new Error(error.message);
  return path;
}

export async function removeAwaPhoto(path: string) {
  await supabase.storage.from(BUCKET).remove([path]);
}

/** Signed URLs (valid an hour) for a set of private photo paths. */
export function useAwaPhotoUrls(paths: (string | null | undefined)[]) {
  const unique = [...new Set(paths.filter((p): p is string => !!p))].sort();
  const { data } = useQuery({
    queryKey: ["awa-photos", unique],
    enabled: typeof window !== "undefined" && unique.length > 0,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(unique, 60 * 60);
      if (error) throw new Error(error.message);
      const map: Record<string, string> = {};
      for (const row of data ?? []) {
        if (row.path && row.signedUrl) map[row.path] = row.signedUrl;
      }
      return map;
    },
  });
  return data ?? {};
}
