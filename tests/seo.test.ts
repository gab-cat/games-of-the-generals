import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { pathToRegexp } from "path-to-regexp";
import {
  PRIVATE_PAGES,
  PUBLIC_PAGES,
  SITE_URL,
  seoForPath,
} from "../src/lib/seo/pages";
import {
  renderHead,
  renderLlmsTxt,
  renderRobots,
  renderShell,
  renderSitemap,
  structuredData,
} from "../src/lib/seo/render";

const root = path.resolve(import.meta.dir, "..");
const vercel = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));

function routeSegments() {
  return fs
    .readdirSync(path.join(root, "src/routes"))
    .filter((f) => f.endsWith(".tsx") && !f.startsWith("__") && f !== "$.tsx")
    .map((f) => f.replace(/\.tsx$/, ""))
    .map((f) => (f === "index" ? "" : f));
}

describe("page lists", () => {
  test("every route file is either public or private", () => {
    const publicSegments = PUBLIC_PAGES.map((p) => p.path.slice(1));
    for (const segment of routeSegments()) {
      const known = publicSegments.includes(segment) || segment in PRIVATE_PAGES;
      expect(known, `src/routes/${segment || "index"}.tsx is not in src/lib/seo/pages.ts`).toBe(true);
    }
  });

  test("titles and descriptions fit search results", () => {
    for (const page of PUBLIC_PAGES) {
      expect(page.title.length).toBeLessThanOrEqual(60);
      expect(page.description.length).toBeGreaterThan(70);
      expect(page.description.length).toBeLessThanOrEqual(160);
    }
    expect(new Set(PUBLIC_PAGES.map((p) => p.title)).size).toBe(PUBLIC_PAGES.length);
  });
});

describe("seoForPath", () => {
  test("public pages are indexed with their own canonical", () => {
    expect(seoForPath("/")).toMatchObject({ index: true, canonical: `${SITE_URL}/` });
    expect(seoForPath("/pricing/")).toMatchObject({ index: true, canonical: `${SITE_URL}/pricing` });
  });

  test("signed-in pages and unknown pages are not indexed", () => {
    expect(seoForPath("/leaderboard")).toMatchObject({ index: false, title: "Leaderboard · Games of the Generals" });
    expect(seoForPath("/admin/users").index).toBe(false);
    expect(seoForPath("/nope").title).toBe("Page not found · Games of the Generals");
  });
});

describe("vercel.json", () => {
  const noindex = vercel.headers.find((h: { headers: { key: string }[] }) =>
    h.headers.some((x) => x.key === "X-Robots-Tag"),
  );
  const noindexMatches = (p: string) => pathToRegexp(noindex.source).test(p);

  test("sends noindex for exactly the private pages", () => {
    for (const segment of Object.keys(PRIVATE_PAGES)) {
      expect(noindexMatches(`/${segment}`), segment).toBe(true);
      expect(noindexMatches(`/${segment}/x`), segment).toBe(true);
    }
    for (const page of PUBLIC_PAGES) expect(noindexMatches(page.path), page.path).toBe(false);
  });

  test("rewrites each public page to its pre-filled HTML file, before the app fallback", () => {
    const rewrites: { source: string; destination: string }[] = vercel.rewrites;
    for (const page of PUBLIC_PAGES.filter((p) => p.path !== "/")) {
      const i = rewrites.findIndex((r) => r.source === page.path);
      expect(i, page.path).toBeGreaterThanOrEqual(0);
      expect(rewrites[i].destination).toBe(`${page.path}.html`);
      expect(i).toBeLessThan(rewrites.findIndex((r) => r.source === "/(.*)"));
    }
  });
});

describe("rendered files", () => {
  test("head has absolute share URLs and valid schema", () => {
    for (const page of PUBLIC_PAGES) {
      const head = renderHead(page);
      expect(head).toContain(`<link rel="canonical" href="${SITE_URL}${page.path === "/" ? "/" : page.path}" />`);
      expect(head).toMatch(/og:image" content="https:\/\//);
      const data = JSON.parse(structuredData(page));
      expect(data["@graph"].length).toBeGreaterThanOrEqual(3);
      // Never claim ratings or reviews the site doesn't collect.
      expect(JSON.stringify(data)).not.toContain("aggregateRating");
    }
  });

  test("home page describes the game with real prices", () => {
    const game = JSON.parse(structuredData(PUBLIC_PAGES[0]))["@graph"].find(
      (n: { "@type": string }) => n["@type"] === "VideoGame",
    );
    expect(game.offers.map((o: { price: number }) => o.price)).toEqual([0, 99, 199]);
  });

  test("static shell has one h1 and links to every public page", () => {
    const shell = renderShell(PUBLIC_PAGES[0]);
    expect(shell.match(/<h1>/g)?.length).toBe(1);
    for (const page of PUBLIC_PAGES) expect(shell).toContain(`href="${page.path}"`);
  });

  test("sitemap lists only public pages on the canonical domain", () => {
    const sitemap = renderSitemap();
    expect(sitemap.match(/<loc>/g)?.length).toBe(PUBLIC_PAGES.length);
    expect(sitemap).not.toContain("localhost");
    expect(sitemap).not.toContain("/admin");
    expect(renderRobots()).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });

  test("llms.txt follows the llmstxt.org layout", () => {
    const llms = renderLlmsTxt();
    expect(llms.startsWith("# Games of the Generals\n\n> ")).toBe(true);
    expect(llms).toContain("## Pages");
    expect(llms).toContain(`(${SITE_URL}/pricing)`);
  });
});
