import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eraser, Pencil, Plus } from "lucide-react";
import { Loading } from "@/components/loading";
import { bingoQueryOptions } from "@/lib/goal-queries";
import {
  clearBingo,
  setBingoCell,
  setBingoSize,
  toggleBingoCell,
} from "@/lib/bingo.functions";
import { cn } from "@/lib/utils";

/** All winning lines (rows, columns, diagonals) for an n×n board. */
function bingoLines(n: number): number[][] {
  const lines: number[][] = [];
  for (let r = 0; r < n; r++)
    lines.push(Array.from({ length: n }, (_, c) => r * n + c));
  for (let c = 0; c < n; c++)
    lines.push(Array.from({ length: n }, (_, r) => r * n + c));
  lines.push(Array.from({ length: n }, (_, i) => i * n + i));
  lines.push(Array.from({ length: n }, (_, i) => i * n + (n - 1 - i)));
  return lines;
}

/**
 * A weekly to-do bingo card: pick a 2x2 (busy week) or 3x3 board, fill the
 * squares with tasks, and dab them off through the week. Completing a line
 * is a bingo.
 */
export function WeeklyBingo() {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery(bingoQueryOptions);
  const [editing, setEditing] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["bingo"] });
  const sizeMut = useMutation({
    mutationFn: (size: number) => setBingoSize({ data: { size } }),
    onSuccess: invalidate,
  });
  const cellMut = useMutation({
    mutationFn: (i: { position: number; text: string }) =>
      setBingoCell({ data: i }),
    onSuccess: invalidate,
  });
  const toggleMut = useMutation({
    mutationFn: (i: { position: number; done: boolean }) =>
      toggleBingoCell({ data: i }),
    onSuccess: invalidate,
  });
  const clearMut = useMutation({
    mutationFn: () => clearBingo(),
    onSuccess: invalidate,
  });

  if (isPending || !data) return <Loading />;

  const size = data.size;
  const cellMap = new Map(data.cells.map((c) => [c.position, c]));
  const donePositions = new Set(
    data.cells.filter((c) => c.done && c.text).map((c) => c.position),
  );
  const completedLines = bingoLines(size).filter((line) =>
    line.every((pos) => donePositions.has(pos)),
  );
  const bingoSet = new Set(completedLines.flat());
  const hasBingo = completedLines.length > 0;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-heading text-sm uppercase text-olive">Weekly bingo</p>
        {hasBingo && (
          <span className="rounded-full bg-gold/20 px-2 py-0.5 font-heading text-[10px] uppercase text-gold-deep">
            Bingo!
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {[2, 3].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => sizeMut.mutate(s)}
              aria-pressed={size === s}
              className={cn(
                "rounded-full px-2.5 py-1 font-heading text-[11px] uppercase transition-colors",
                size === s ? "bg-olive text-white" : "bg-black/5 text-black/50",
              )}
            >
              {s}×{s}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className={cn(
              "ml-1 flex items-center gap-1 rounded-full px-2.5 py-1 font-heading text-[11px] uppercase transition-colors",
              editing ? "bg-olive text-white" : "bg-black/5 text-black/60",
            )}
          >
            <Pencil className="size-3" strokeWidth={2} />
            {editing ? "Done" : "Edit"}
          </button>
          <button
            type="button"
            onClick={() => clearMut.mutate()}
            aria-label="Clear the board"
            title="Clear for a new week"
            className="grid size-7 place-items-center rounded-full text-black/30 transition-colors hover:bg-black/5 hover:text-clay-deep"
          >
            <Eraser className="size-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      <p className="mt-1 font-serif text-xs text-black/40">
        {editing
          ? "Fill each square with something to do this week."
          : "Tap a square to dab it off. Complete a line for a bingo."}
      </p>

      <div
        className={cn(
          "mt-3 grid gap-2",
          size === 2 ? "grid-cols-2" : "grid-cols-3",
        )}
      >
        {Array.from({ length: size * size }, (_, pos) => {
          const cell = cellMap.get(pos);
          if (editing) {
            return (
              <BingoCellEdit
                key={pos}
                text={cell?.text ?? ""}
                onSave={(text) => cellMut.mutate({ position: pos, text })}
              />
            );
          }
          const filled = !!cell?.text;
          const done = !!cell?.done;
          return (
            <button
              key={pos}
              type="button"
              disabled={!filled}
              onClick={() =>
                filled && toggleMut.mutate({ position: pos, done: !done })
              }
              className={cn(
                "flex aspect-square items-center justify-center rounded-xl p-2 text-center font-serif text-xs leading-tight transition-colors [overflow-wrap:anywhere]",
                done
                  ? "bg-olive text-white"
                  : filled
                    ? "bg-black/5 text-black hover:bg-black/10"
                    : "bg-black/[0.03] text-black/25",
                bingoSet.has(pos) && "ring-2 ring-gold-deep",
              )}
            >
              {filled ? cell!.text : <Plus className="size-4" strokeWidth={2} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** A single editable square (its own text state, saved on blur). */
function BingoCellEdit({
  text,
  onSave,
}: {
  text: string;
  onSave: (text: string) => void;
}) {
  const [val, setVal] = useState(text);
  useEffect(() => setVal(text), [text]);
  return (
    <textarea
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        const t = val.trim();
        if (t !== text) onSave(t);
      }}
      placeholder="Task…"
      rows={2}
      maxLength={200}
      aria-label="Bingo square"
      className="aspect-square resize-none rounded-xl bg-black/5 p-2 text-center font-serif text-xs leading-tight text-black placeholder:text-black/30 focus:outline-none focus:ring-1 focus:ring-olive/40"
    />
  );
}
