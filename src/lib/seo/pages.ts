/*
 * What search engines and link previews see for each page. One source for the
 * build (scripts/seo-plugin.ts writes a pre-filled HTML file per public page,
 * plus sitemap.xml and robots.txt) and the browser (runtime.ts keeps the tab
 * title, description, canonical and robots tags in step with the route).
 *
 * No DOM or Node APIs in this file: vite.config.ts imports it at build time.
 */
import { pricingTiers } from "../pricing-tiers";

export const SITE_URL = "https://www.generalsonline.app";
export const SITE_NAME = "Games of the Generals";

export const SHARE_IMAGE = {
  path: "/og/share-1200x630.png",
  width: 1200,
  height: 630,
  alt: "Games of the Generals, Season 3: the blue and red armies meet head on.",
};

function tierPrice(name: string) {
  return pricingTiers.find((tier) => tier.name === name)?.price ?? "";
}

export type PublicPage = {
  path: string;
  /** The full <title>. */
  title: string;
  /** Meta description, about 150 characters. */
  description: string;
  /** The <h1> in the static HTML that crawlers without JavaScript read. */
  heading: string;
  /** Extra paragraphs for that static HTML. Must match what the page says. */
  body?: string[];
  schemaType: "WebPage" | "AboutPage";
};

/** Pages anyone can open without signing in. Only these are indexed. */
export const PUBLIC_PAGES: PublicPage[] = [
  {
    path: "/",
    title: "Games of the Generals: play Salpakan online",
    description:
      "Play Game of the Generals (Salpakan) online for free. Ranked quick match, lobbies with friends, an AI to practise against, live spectating and replays.",
    heading: "Games of the Generals",
    body: [
      "The Filipino strategy board game of hidden ranks, played live against real opponents.",
      "Each player sets up 21 pieces. You can see your own ranks but not your opponent's, so every challenge is a guess about what is hiding behind the piece in front of you. The higher rank wins a challenge, and capturing the flag or reaching the far row with yours ends the game.",
      "Play ranked quick match, open a lobby for a friend, practise against the AI, watch live games and replay finished ones. It runs in the browser on phone and desktop.",
    ],
    schemaType: "WebPage",
  },
  {
    path: "/about",
    title: "About · Games of the Generals",
    description:
      "Games of the Generals is the Filipino board game Salpakan, played online against real people. How the game works and who makes it.",
    heading: "About Games of the Generals",
    body: [
      "Games of the Generals is built and run by Gabriel Catimbang to keep the classic Game of the Generals alive and bring it online.",
    ],
    schemaType: "AboutPage",
  },
  {
    path: "/pricing",
    title: "Plans and pricing · Games of the Generals",
    description: `Playing is free. Pro (${tierPrice("Pro")} a month) and Pro+ (${tierPrice("Pro+")} a month) add the hard AI, more private lobbies and more saved replays. Nothing renews by itself.`,
    heading: "Pick your plan",
    schemaType: "WebPage",
  },
  {
    path: "/privacy",
    title: "Privacy policy · Games of the Generals",
    description:
      "What Games of the Generals collects when you play, how it is used and kept, and the choices you have about your data.",
    heading: "Privacy policy",
    schemaType: "WebPage",
  },
  {
    path: "/terms",
    title: "Terms of service · Games of the Generals",
    description:
      "The terms for using Games of the Generals, covering accounts, fair play, chat, paid plans and refunds.",
    heading: "Terms of service",
    schemaType: "WebPage",
  },
];

/**
 * Pages behind sign-in, plus tools. Signed-out visitors (and crawlers) get the
 * sign-in form there, so they are kept out of search with `noindex`. The name
 * is only the tab title. vercel.json sends `X-Robots-Tag: noindex` for these
 * too; tests/seo.test.ts keeps the two lists in step.
 */
export const PRIVATE_PAGES: Record<string, string> = {
  achievements: "Achievements",
  admin: "Admin",
  "ai-game": "Play the AI",
  announcements: "News",
  auth: "Sign in",
  game: "Game",
  leaderboard: "Leaderboard",
  maintenance: "Maintenance",
  "match-history": "Match history",
  profile: "Profile",
  replay: "Replay",
  settings: "Settings",
  spectate: "Spectate",
  subscription: "Subscription",
  support: "Support",
  "support-resolve": "Support",
  "test-countdown": "Test",
};

export type RouteSeo = {
  title: string;
  description: string;
  canonical: string;
  index: boolean;
};

const HOME = PUBLIC_PAGES[0];

export function canonicalUrl(path: string) {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

export function seoForPath(pathname: string): RouteSeo {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : "/";
  const page = PUBLIC_PAGES.find((p) => p.path === path);
  if (page) {
    return {
      title: page.title,
      description: page.description,
      canonical: canonicalUrl(page.path),
      index: true,
    };
  }

  const name = PRIVATE_PAGES[path.split("/")[1] ?? ""];
  return {
    title: `${name ?? "Page not found"} · ${SITE_NAME}`,
    description: HOME.description,
    canonical: canonicalUrl(path),
    index: false,
  };
}
