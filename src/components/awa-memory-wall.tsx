import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { formatAwaTime } from "@/components/awa-log-modal";
import {
  HobbyIcon,
  durationLabel,
  hobbyAccent,
  shortDate,
  useAwaPhotoUrls,
  type AwaHobby,
  type AwaLog,
} from "@/components/awa-ui";
import { cn } from "@/lib/utils";

/* A masonry wall of hobby memories: photos at their own shape, colour tiles otherwise. */

/** Two columns on phones, three from tablet up. */
function useColumnCount() {
  const [cols, setCols] = useState(2);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const update = () => setCols(mql.matches ? 3 : 2);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return cols;
}

/** A stable 0–2 pick per memory so colour tiles get varied heights. */
function variantOf(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i)) % 997;
  return n % 3;
}

const TILE_HEIGHTS = ["h-24", "h-32", "h-40"];
const TILE_WEIGHT = [0.75, 1, 1.25];

/** Rough tile height, used to keep the columns even. */
function estimate(log: AwaLog) {
  const body = 0.45 + Math.min(log.note?.length ?? 0, 120) / 160;
  return (log.photo_path ? 1.3 : (TILE_WEIGHT[variantOf(log.id)] ?? 1)) + body;
}

export function MemoryWall({
  logs,
  byId,
  onOpen,
}: {
  logs: AwaLog[];
  byId: Map<string, AwaHobby>;
  onOpen: (log: AwaLog) => void;
}) {
  const cols = useColumnCount();
  const photoUrls = useAwaPhotoUrls(logs.map((l) => l.photo_path));

  // Newest first, each memory dropped into the shortest column.
  const columns = useMemo(() => {
    const out: AwaLog[][] = Array.from({ length: cols }, () => []);
    const heights = Array.from({ length: cols }, () => 0);
    for (const l of logs) {
      let i = 0;
      for (let c = 1; c < cols; c++) if ((heights[c] ?? 0) < (heights[i] ?? 0)) i = c;
      out[i]?.push(l);
      heights[i] = (heights[i] ?? 0) + estimate(l);
    }
    return out;
  }, [logs, cols]);

  return (
    <div className="flex items-start gap-3">
      {columns.map((col, ci) => (
        <div key={ci} className="flex min-w-0 flex-1 flex-col gap-3">
          {col.map((l) => (
            <MemoryTile
              key={l.id}
              log={l}
              hobby={l.hobby_id ? byId.get(l.hobby_id) : undefined}
              photoUrl={l.photo_path ? photoUrls[l.photo_path] : undefined}
              onClick={() => onOpen(l)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function MemoryTile({
  log,
  hobby,
  photoUrl,
  onClick,
}: {
  log: AwaLog;
  hobby: AwaHobby | undefined;
  photoUrl: string | undefined;
  onClick: () => void;
}) {
  const style = hobbyAccent(hobby?.accent);
  const name = hobby?.name ?? log.hobby_name;
  const when =
    durationLabel(log.duration) ?? (log.activity_time ? formatAwaTime(log.activity_time) : null);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="block w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm transition-transform hover:-translate-y-0.5"
    >
      {log.photo_path ? (
        <div className={cn("relative min-h-28 w-full", style.surface)}>
          {photoUrl && <img src={photoUrl} alt="" className="block h-auto w-full" />}
        </div>
      ) : (
        <div
          className={cn(
            "relative grid w-full place-items-center text-white",
            style.surface,
            TILE_HEIGHTS[variantOf(log.id)],
          )}
        >
          <HobbyIcon icon={hobby?.icon ?? log.hobby_icon} className="size-12 text-4xl" />
        </div>
      )}
      <div className="px-3 pt-2 pb-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn("truncate font-heading text-xs", style.text)}>{name}</span>
          <span className="shrink-0 font-serif text-[10px] text-black/40">
            {shortDate(log.logged_on)}
          </span>
        </div>
        {log.note && (
          <p className="mt-1 line-clamp-4 font-serif text-[13px] leading-snug text-black/75">
            {log.note}
          </p>
        )}
        {when && <p className="mt-1 font-serif text-[11px] text-black/40">{when}</p>}
      </div>
    </motion.button>
  );
}
