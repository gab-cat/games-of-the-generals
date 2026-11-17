/*
 * Keeps the tab title and the search tags in step with the route after the
 * first page load. The first load already has the right tags from the build
 * (scripts/seo-plugin.ts); this covers in-app navigation, pages served from the
 * plain index.html (signed-in pages, 404s) and the unread-message badge.
 */
import { seoForPath } from "./pages";

let baseTitle = typeof document === "undefined" ? "" : document.title;
let badge = 0;

function paintTitle() {
  document.title = badge > 0 ? `(${badge}) ${baseTitle}` : baseTitle;
}

/** Shows an unread count in front of the page title, or clears it with 0. */
export function setTitleBadge(count: number) {
  badge = Math.max(0, count);
  paintTitle();
}

function setMeta(attr: "name" | "property", key: string, content: string) {
  const el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (el) {
    el.content = content;
    return;
  }
  const meta = document.createElement("meta");
  meta.setAttribute(attr, key);
  meta.content = content;
  document.head.appendChild(meta);
}

export function applyRouteSeo(pathname: string) {
  const seo = seoForPath(pathname);
  baseTitle = seo.title;
  paintTitle();

  setMeta("name", "description", seo.description);
  setMeta("name", "robots", seo.index ? "index, follow, max-image-preview:large" : "noindex, follow");
  setMeta("property", "og:title", seo.title);
  setMeta("property", "og:description", seo.description);
  setMeta("property", "og:url", seo.canonical);
  setMeta("name", "twitter:title", seo.title);
  setMeta("name", "twitter:description", seo.description);

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = seo.canonical;
}
