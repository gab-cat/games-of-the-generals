/*
 * Turns the page list in pages.ts into the files crawlers read: the <head> tags
 * and static body for each public page, sitemap.xml, robots.txt and llms.txt.
 * Pure string functions, used by scripts/seo-plugin.ts at build time and by
 * tests/seo.test.ts.
 */
import { pricingTiers } from "../pricing-tiers";
import { DISCORD_INVITE_URL } from "../community";
import {
  PUBLIC_PAGES,
  SHARE_IMAGE,
  SITE_NAME,
  SITE_URL,
  canonicalUrl,
  type PublicPage,
} from "./pages";

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;
const GAME_ID = `${SITE_URL}/#game`;
const SHARE_IMAGE_URL = `${SITE_URL}${SHARE_IMAGE.path}`;

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function findPage(path: string): PublicPage {
  const page = PUBLIC_PAGES.find((p) => p.path === path);
  if (!page) throw new Error(`No public page for ${path}`);
  return page;
}

function tierPrice(name: string) {
  return pricingTiers.find((tier) => tier.name === name)?.price ?? "";
}

function priceNumber(price: string) {
  const n = Number(price.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** schema.org graph: who runs the site, the site, this page, and on the home page the game. */
export function structuredData(page: PublicPage) {
  const url = canonicalUrl(page.path);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": ORG_ID,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icons/icon-512.png`,
        width: 512,
        height: 512,
      },
      founder: {
        "@type": "Person",
        name: "Gabriel Catimbang",
        sameAs: ["https://www.linkedin.com/in/gabrielcatimbang/"],
      },
      sameAs: ["https://github.com/gab-cat/games-of-the-generals", DISCORD_INVITE_URL],
    },
    {
      "@type": "WebSite",
      "@id": SITE_ID,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      inLanguage: "en",
      publisher: { "@id": ORG_ID },
    },
    {
      "@type": page.schemaType,
      "@id": `${url}#webpage`,
      url,
      name: page.title,
      description: page.description,
      inLanguage: "en",
      isPartOf: { "@id": SITE_ID },
      primaryImageOfPage: SHARE_IMAGE_URL,
      ...(page.path === "/" ? { about: { "@id": GAME_ID } } : {}),
    },
  ];

  if (page.path === "/") {
    graph.push({
      "@type": "VideoGame",
      "@id": GAME_ID,
      name: SITE_NAME,
      alternateName: ["Game of the Generals", "Salpakan"],
      description: page.description,
      url: `${SITE_URL}/`,
      image: SHARE_IMAGE_URL,
      genre: ["Strategy", "Board game"],
      playMode: ["MultiPlayer", "SinglePlayer"],
      numberOfPlayers: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2 },
      gamePlatform: "Web browser",
      applicationCategory: "GameApplication",
      operatingSystem: "Any (web browser)",
      inLanguage: "en",
      isAccessibleForFree: true,
      author: { "@id": ORG_ID },
      publisher: { "@id": ORG_ID },
      offers: pricingTiers.map((tier) => ({
        "@type": "Offer",
        name: tier.name,
        price: priceNumber(tier.price),
        priceCurrency: "PHP",
        url: tier.price === "Free" ? `${SITE_URL}/` : `${SITE_URL}/pricing`,
        availability: "https://schema.org/InStock",
      })),
    });
  }

  // `<` is escaped so no string in the data can close the script tag.
  return JSON.stringify(
    { "@context": "https://schema.org", "@graph": graph },
    null,
    2,
  ).replace(/</g, "\\u003c");
}

/** Every <head> tag that differs per page. */
export function renderHead(page: PublicPage) {
  const url = canonicalUrl(page.path);
  const t = escapeHtml(page.title);
  const d = escapeHtml(page.description);
  const alt = escapeHtml(SHARE_IMAGE.alt);
  return [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:image" content="${SHARE_IMAGE_URL}" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:width" content="${SHARE_IMAGE.width}" />`,
    `<meta property="og:image:height" content="${SHARE_IMAGE.height}" />`,
    `<meta property="og:image:alt" content="${alt}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${SHARE_IMAGE_URL}" />`,
    `<meta name="twitter:image:alt" content="${alt}" />`,
    `<script type="application/ld+json">${structuredData(page)}</script>`,
  ].join("\n    ");
}

/**
 * Static content inside #root for crawlers that don't run JavaScript. React
 * replaces it on first render; until then the boot screen covers it. Without
 * JavaScript the boot screen is hidden and this is what shows.
 */
export function renderShell(page: PublicPage) {
  const links = PUBLIC_PAGES.map((p) => {
    const label = p.path === "/" ? "Play" : p.heading.replace(/ Games of the Generals$/, "");
    return `<a href="${p.path}">${escapeHtml(label)}</a>`;
  }).join(" · ");
  const body = (page.body ?? [page.description])
    .map((text) => `<p>${escapeHtml(text)}</p>`)
    .join("");
  return (
    `<main class="seo-shell"><h1>${escapeHtml(page.heading)}</h1>${body}` +
    `<noscript><p>Games of the Generals needs JavaScript to play. Turn it on and reload the page.</p></noscript>` +
    `<nav aria-label="Site">${links}</nav></main>`
  );
}

export function renderSitemap() {
  const urls = PUBLIC_PAGES.map(
    (p) => `  <url>\n    <loc>${canonicalUrl(p.path)}</loc>\n  </url>`,
  ).join("\n");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
}

export function renderRobots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}

/** llms.txt (llmstxt.org): a plain summary of the site for AI assistants. */
export function renderLlmsTxt() {
  const pages = PUBLIC_PAGES.map(
    (p) => `- [${p.heading}](${canonicalUrl(p.path)}): ${p.description}`,
  ).join("\n");
  const plans = [
    `- Standard: free. Every game mode, the easy and medium AI, 10 private lobbies a day and a replay of your last match.`,
    `- Pro: ${tierPrice("Pro")} a month. Adds the hard AI, 50 private lobbies a day, 50 saved replays and custom avatars.`,
    `- Pro+: ${tierPrice("Pro+")} a month. Everything in Pro, with unlimited private lobbies and 100 saved replays.`,
  ].join("\n");
  return `# ${SITE_NAME}

> ${findPage("/").description}

Games of the Generals is an online version of Game of the Generals, also called Salpakan: a Filipino two-player strategy board game from 1970. It is free to play in a web browser on phone or desktop, at ${SITE_URL}/. It is built and run by Gabriel Catimbang.

## How the game works

- The board has 8 rows and 9 columns. Each player has 21 pieces: a Flag, 2 Spies, 6 Privates, a Sergeant, 2nd and 1st Lieutenants, a Captain, a Major, a Lieutenant Colonel, a Colonel, and 1 to 5 Star Generals.
- Players place their pieces on their own three rows in secret. You see your own ranks, not your opponent's.
- When two pieces meet, the higher rank stays and the lower one is removed. Equal ranks remove each other. The Spy beats every rank from Sergeant up but loses to a Private. Any piece captures the Flag.
- You win by capturing the opponent's Flag, or by moving your own Flag to the far row and having it survive your opponent's next turn.

## What you can do on the site

- Ranked quick match against another player, with an ELO rating and a leaderboard.
- Lobbies to play a friend, with classic, blitz (a faster clock) or reveal modes.
- Practice games against an AI opponent.
- Watch live games as a spectator, and replay finished games move by move.
- Play as a guest, or make an account to keep your rating, history and achievements.

## Plans

${plans}

Paid plans are paid once for the months you pick and do not renew by themselves.

## Pages

${pages}

## Source

- [Source code on GitHub](https://github.com/gab-cat/games-of-the-generals)

## Community

- [Generals Online Discord](${DISCORD_INVITE_URL})
`;
}
