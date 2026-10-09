import { useState } from "react";
import { NotebookPen } from "lucide-react";

const MORNING_PAGES_URL = "https://morning-ink.lovable.app/";

/** Morning pages lives in a separate app, so check before leaving. */
function useMorningPages() {
  const [asking, setAsking] = useState(false);
  return {
    ask: () => setAsking(true),
    dialog: asking ? <MorningPagesDialog onClose={() => setAsking(false)} /> : null,
  };
}

function MorningPagesDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="morning-pages-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-background p-6 text-center shadow-xl [animation:rise_0.25s_both]"
      >
        <NotebookPen className="mx-auto size-8 text-olive" strokeWidth={1.75} />
        <h2
          id="morning-pages-title"
          className="mt-3 font-display text-2xl leading-tight text-black"
        >
          Open Morning pages?
        </h2>
        <p className="mt-2 font-serif text-sm text-black/55">
          This will open externally, in a new tab. Do you want to proceed?
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="rounded-2xl bg-black/5 py-3 font-heading text-sm uppercase text-black/60 transition-colors hover:bg-black/10"
          >
            No
          </button>
          <button
            type="button"
            onClick={() => {
              window.open(MORNING_PAGES_URL, "_blank", "noopener,noreferrer");
              onClose();
            }}
            className="rounded-2xl bg-olive py-3 font-heading text-sm uppercase text-white transition-colors hover:bg-olive/90"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}

/** Sidebar entry for Morning pages. */
export function MorningPagesLink() {
  const { ask, dialog } = useMorningPages();
  return (
    <>
      <button
        type="button"
        onClick={ask}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left font-heading text-sm uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted/50"
      >
        <NotebookPen className="size-5" strokeWidth={2} />
        Morning pages
      </button>
      {dialog}
    </>
  );
}

/** Bottom-nav tab for Morning pages, sized like the other tabs. */
export function MorningPagesTab({ className }: { className?: string }) {
  const { ask, dialog } = useMorningPages();
  return (
    <>
      <button type="button" onClick={ask} className={className}>
        <NotebookPen className="size-5" strokeWidth={2} />
        Morning
      </button>
      {dialog}
    </>
  );
}
