import { useEffect, useState } from "react";

/** The page title, last-updated date and table of contents shared by the legal pages. */
export function LegalHeader({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: { id: string; label: string }[];
}) {
  return (
    <>
      <header>
        <h1 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: <time dateTime={updated}>{updated}</time>
        </p>
      </header>
      <nav
        aria-label="Contents"
        className="rounded-lg border border-border bg-card p-4 sm:p-5"
      >
        <p className="text-sm font-semibold text-foreground">Contents</p>
        <ol className="mt-3 columns-1 gap-x-8 text-sm sm:columns-2">
          {sections.map((s) => (
            <li key={s.id} className="break-inside-avoid">
              <a
                href={`#${s.id}`}
                className="-mx-2 block rounded px-2 py-1.5 text-foreground/90 transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

/** Small "back to top" link shown after scrolling, so long pages are easy to leave. */
export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-4 right-4 z-30 h-10 rounded-md border border-border-strong bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-[0.98]"
    >
      Back to top
    </button>
  );
}
