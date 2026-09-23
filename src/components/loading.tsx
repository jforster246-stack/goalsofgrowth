import { STAR_PATH } from "@/components/goal-ui";

/** A gentle pulsing star used while data loads. */
export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <svg
        viewBox="0 0 24 24"
        className="size-10 fill-olive [animation:pulse-star_1.1s_ease-in-out_infinite]"
        aria-hidden
      >
        <path d={STAR_PATH} fillRule="evenodd" />
      </svg>
      <p className="font-heading text-xs uppercase tracking-wide text-olive/60">
        {label}
      </p>
    </div>
  );
}
