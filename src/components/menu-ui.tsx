import { useState, type ReactNode } from "react";
import { ModalShell } from "@/components/artwork-modal";
import { IconPicker } from "@/components/icon-picker";
import { cn } from "@/lib/utils";

export type Energy = "low" | "medium" | "high";
export type Kind = "hobby" | "cleaning" | "task" | "errand" | "creative" | "other";

export const KIND_LABEL: Record<Kind, string> = {
  hobby: "Hobby",
  cleaning: "Cleaning",
  task: "Task",
  errand: "Errand",
  creative: "Creative project",
  other: "Other",
};
export const ENERGY_LABEL: Record<Energy, string> = { low: "Low", medium: "Medium", high: "High" };
export const DURATIONS = [5, 10, 15, 30, 45, 60];

export function durationText(m: number | null | undefined) {
  if (!m) return null;
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

export const inputClass =
  "w-full rounded-xl bg-white px-3 py-2.5 text-sm text-foreground ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-ring";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-heading text-xs uppercase tracking-wide text-olive">{label}</span>
      {children}
    </label>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
        active ? "bg-olive text-white" : "bg-black/5 text-foreground/70 hover:bg-black/10",
      )}
    >
      {children}
    </button>
  );
}

export type MenuDraft = {
  name: string;
  description: string;
  category: string;
  icon: string | null;
};

export function MenuFormModal({
  initial,
  title,
  saving,
  onSave,
  onClose,
}: {
  initial?: Partial<MenuDraft> | undefined;
  title: string;
  saving: boolean;
  onSave: (d: MenuDraft) => void;
  onClose: () => void;
}) {
  const [d, setD] = useState<MenuDraft>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "",
    icon: initial?.icon ?? null,
  });
  return (
    <ModalShell title={title} onClose={onClose}>
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (d.name.trim()) onSave(d);
        }}
      >
        <Field label="Name">
          <input
            autoFocus
            required
            maxLength={80}
            value={d.name}
            onChange={(e) => setD({ ...d, name: e.target.value })}
            placeholder="After work"
            className={inputClass}
          />
        </Field>
        <Field label="Description (optional)">
          <input
            maxLength={300}
            value={d.description}
            onChange={(e) => setD({ ...d, description: e.target.value })}
            placeholder="Gentle things for when I get home"
            className={inputClass}
          />
        </Field>
        <Field label="Category (optional)">
          <input
            maxLength={40}
            value={d.category}
            onChange={(e) => setD({ ...d, category: e.target.value })}
            placeholder="Home, rest, creative…"
            className={inputClass}
          />
        </Field>
        <Field label="Icon (optional)">
          <IconPicker value={d.icon} onChange={(icon) => setD({ ...d, icon })} defaultLabel="None" />
        </Field>
        <button
          type="submit"
          disabled={saving || !d.name.trim()}
          className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save menu"}
        </button>
      </form>
    </ModalShell>
  );
}

export type ActivityDraft = {
  name: string;
  durationMinutes: number | null;
  energy: Energy | null;
  kind: Kind;
  notes: string;
};

export function ActivityFields({
  d,
  setD,
  nameLocked,
}: {
  d: ActivityDraft;
  setD: (d: ActivityDraft) => void;
  nameLocked?: boolean;
}) {
  const custom = d.durationMinutes != null && !DURATIONS.includes(d.durationMinutes);
  const [showCustom, setShowCustom] = useState(custom);
  return (
    <div className="space-y-4">
      {!nameLocked && (
        <Field label="Activity">
          <input
            autoFocus
            required
            maxLength={120}
            value={d.name}
            onChange={(e) => setD({ ...d, name: e.target.value })}
            placeholder="Water the plants"
            className={inputClass}
          />
        </Field>
      )}
      <Field label="How long">
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((m) => (
            <Chip
              key={m}
              active={!showCustom && d.durationMinutes === m}
              onClick={() => {
                setShowCustom(false);
                setD({ ...d, durationMinutes: d.durationMinutes === m ? null : m });
              }}
            >
              {m} min
            </Chip>
          ))}
          <Chip active={showCustom} onClick={() => setShowCustom(!showCustom)}>
            Custom
          </Chip>
        </div>
        {showCustom && (
          <input
            type="number"
            min={1}
            max={1440}
            value={d.durationMinutes ?? ""}
            onChange={(e) =>
              setD({ ...d, durationMinutes: e.target.value ? Math.max(1, Number(e.target.value)) : null })
            }
            placeholder="Minutes"
            className={cn(inputClass, "mt-2 w-32")}
          />
        )}
      </Field>
      <Field label="Energy">
        <div className="flex flex-wrap gap-2">
          {(["low", "medium", "high"] as Energy[]).map((e) => (
            <Chip key={e} active={d.energy === e} onClick={() => setD({ ...d, energy: d.energy === e ? null : e })}>
              {ENERGY_LABEL[e]}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Type">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
            <Chip key={k} active={d.kind === k} onClick={() => setD({ ...d, kind: k })}>
              {KIND_LABEL[k]}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Notes (optional)">
        <textarea
          rows={2}
          maxLength={1000}
          value={d.notes}
          onChange={(e) => setD({ ...d, notes: e.target.value })}
          className={inputClass}
        />
      </Field>
    </div>
  );
}

export function EnergyDots({ energy }: { energy: Energy | null }) {
  if (!energy) return null;
  const n = energy === "low" ? 1 : energy === "medium" ? 2 : 3;
  return (
    <span className="inline-flex items-center gap-1" title={`${ENERGY_LABEL[energy]} energy`}>
      <span className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn("size-1.5 rounded-full", i <= n ? "bg-olive" : "bg-black/15")} />
        ))}
      </span>
      {ENERGY_LABEL[energy]}
    </span>
  );
}
