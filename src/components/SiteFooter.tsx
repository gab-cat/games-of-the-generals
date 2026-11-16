import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { BrandLockup } from "./BrandMark";
import { ChevronClash } from "./season/ChevronClash";
import { cn } from "@/lib/utils";
import packageJson from "../../package.json";

/*
 * The site footer, a title card for the game: "Generals" at poster size, cut
 * by the bottom of the page, with the Season 3 clash (ChevronClash) charging
 * through the letters when the footer comes into view.
 *
 * - "full": signed-out pages. Brand, credit, link columns, version.
 * - "minimal": signed-in pages, where the header, tab bar and account menu
 *   already carry the main navigation. One row of the links that live nowhere
 *   else, over the top half of the word.
 */

export const SOURCE_URL = "https://github.com/gab-cat/games-of-the-generals";
const LINKEDIN_URL = "https://www.linkedin.com/in/gabrielcatimbang/";

type FooterLink = {
  label: string;
  to: string;
  search?: Record<string, unknown>;
};

const FOOTER_GROUPS: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Play",
    links: [
      { label: "Lobbies", to: "/", search: { lobbyId: undefined } },
      { label: "Play the AI", to: "/ai-game" },
      { label: "Leaderboard", to: "/leaderboard" },
      { label: "Match history", to: "/match-history" },
      { label: "News", to: "/announcements" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Support", to: "/support", search: { ticketId: undefined } },
      { label: "About", to: "/about" },
      { label: "Pricing", to: "/pricing" },
      { label: "Settings", to: "/settings" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", to: "/privacy" },
      { label: "Terms of service", to: "/terms" },
    ],
  },
];

/** Signed-in players reach everything else from the header and account menu. */
const MINIMAL_LINKS: FooterLink[] = [
  { label: "About", to: "/about" },
  { label: "Pricing", to: "/pricing" },
  { label: "Support", to: "/support", search: { ticketId: undefined } },
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
];

const linkClass =
  "rounded-sm text-sm text-foreground/80 underline decoration-transparent underline-offset-4 transition-colors hover:text-foreground hover:decoration-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70";

function FooterLinkItem({ link }: { link: FooterLink }) {
  return (
    <Link to={link.to} search={link.search as never} className={linkClass}>
      {link.label}
    </Link>
  );
}

/**
 * "Generals", sized to the footer's width and cut by the page edge. The clash
 * mounts only once the word is on screen, so its charge plays when seen.
 */
function ClashWordmark({ compact = false }: { compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const word =
    "absolute inset-x-0 top-0 whitespace-nowrap text-center font-display font-bold leading-none tracking-[-0.055em]";
  return (
    // Font size in cqw (the footer's width) and height in em, so the page edge
    // cuts the letters at the same place on every screen.
    <div ref={ref} aria-hidden="true" className="select-none [container-type:inline-size]">
      <div
        className={cn(
          "relative isolate overflow-hidden",
          compact ? "h-[0.5em] text-[20cqw] sm:text-[11cqw]" : "h-[0.74em] text-[20cqw]",
        )}
      >
        {/* Dark army colours, so letters the chevrons don't cover still read blue and red */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#16295a_0%,#16295a_50%,#5a1a16_50%,#5a1a16_100%)]" />
        {inView && (
          <ChevronClash className="absolute inset-0" fadeTo="transparent" delay={0.05} />
        )}
        {/* Page colour everywhere but the letters, so the clash shows only through them */}
        <div className="absolute inset-0 bg-background mix-blend-multiply">
          <span className={cn(word, "text-white")}>Generals</span>
        </div>
        {/* A hairline outline, so the word reads before the clash arrives */}
        <span
          className={cn(
            word,
            "text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.16)]",
          )}
        >
          Generals
        </span>
      </div>
    </div>
  );
}

export function SiteFooter({ variant }: { variant: "full" | "minimal" }) {
  const year = new Date().getFullYear();
  const version = packageJson.version;
  const footerRef = useRef<HTMLElement>(null);
  const footerSeen = useInView(footerRef, { once: true, amount: 0.25 });

  if (variant === "minimal") {
    return (
      <footer className="relative z-10 mt-auto overflow-hidden">
        <div className="mx-auto max-w-7xl">
          {/* lg:pr-48 keeps the links clear of the floating Global chat button */}
          <div className="flex flex-col items-center gap-3 px-4 py-4 sm:flex-row sm:justify-between sm:px-6 lg:pr-48">
            <nav
              aria-label="Footer"
              className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
            >
              {MINIMAL_LINKS.map((link) => (
                <FooterLinkItem key={link.label} link={link} />
              ))}
              <a href={SOURCE_URL} target="_blank" rel="noreferrer" className={linkClass}>
                Source code
              </a>
            </nav>
            <p className="text-xs text-muted-foreground">
              © {year} · v{version}
            </p>
          </div>
          <ClashWordmark compact />
        </div>
      </footer>
    );
  }

  return (
    <footer
      ref={footerRef}
      className="relative z-10 mt-auto overflow-hidden border-t border-border"
    >
      <div className="mx-auto max-w-7xl">
        <div className="px-4 pt-10 sm:px-6 sm:pt-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
            <div className="max-w-sm">
              <Link
                to="/"
                search={{ lobbyId: undefined }}
                className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              >
                <BrandLockup />
              </Link>
              <p className="mt-3 text-sm text-foreground/85">
                Salpakan, the Filipino board game of hidden ranks, invented by
                Sofronio H. Pasola Jr. in 1970.
              </p>
              <p className="mt-4 text-sm text-foreground/80">
                Made by{" "}
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(linkClass, "font-medium text-foreground")}
                >
                  Gabriel Catimbang
                </a>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
              {FOOTER_GROUPS.map((group) => (
                <div key={group.title}>
                  <h2 className="text-sm font-medium text-foreground">{group.title}</h2>
                  <ul className="mt-3 space-y-2">
                    {group.links.map((link) => (
                      <li key={link.label}>
                        <FooterLinkItem link={link} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mt-12 flex items-center gap-4 pb-3 text-xs text-muted-foreground">
            <span>
              © {year} Games of the Generals · v{version}
            </span>
            <a
              href={SOURCE_URL}
              target="_blank"
              rel="noreferrer"
              className={cn(linkClass, "text-xs")}
            >
              Source code
            </a>
            <motion.span
              aria-hidden="true"
              initial={{ opacity: 0, scale: 1.6, rotate: -16 }}
              // Lands after the clash; triggered by the whole footer, since the
              // scaled-up sticker itself pokes outside the clipped edge.
              animate={footerSeen ? { opacity: 1, scale: 1, rotate: -6 } : undefined}
              transition={{ delay: 1.3, type: "spring", stiffness: 380, damping: 18 }}
              className="absolute -bottom-4 right-3 z-10 hidden rounded-md border-2 border-[#17110a] bg-gold-500 px-3 py-1.5 text-lg font-bold leading-none text-[#17110a] sm:block sm:right-10 sm:text-xl"
            >
              Since 1970
            </motion.span>
          </div>
        </div>
        <ClashWordmark />
      </div>
    </footer>
  );
}
