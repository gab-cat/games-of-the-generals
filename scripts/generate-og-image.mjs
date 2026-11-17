/*
 * Renders the link-preview image (public/og/share-1200x630.png) from the
 * Season 3 title card in index.html, so the two never drift. Needs Google
 * Chrome installed. Run after changing the title card:
 *
 *   node scripts/generate-og-image.mjs
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

const style = html.match(/<style>([\s\S]*?)<\/style>/)?.[1];
const bootStart = html.indexOf('<div id="boot"');
const bootEnd = html.indexOf('<div id="root"');
if (!style || bootStart < 0 || bootEnd < 0) {
  throw new Error("Couldn't find the title card in index.html");
}
const boot = html.slice(bootStart, bootEnd);

const page = `<!doctype html>
<html><head><meta charset="utf-8"><style>
${style}
html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
/* A still frame: everything in place, the gold flash at its peak. */
.boot { --band: 250px; --word: 640px; justify-content: center; padding-bottom: 8px; }
.boot *, .boot { animation: none !important; transition: none !important; }
.boot-flash { opacity: 0.9; }
.boot-sticker { top: -18px; right: calc(600px - 320px - 24px); }
</style></head><body>${boot}</body></html>`;

const chrome =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "og-"));
const source = path.join(tmp, "og.html");
fs.writeFileSync(source, page);

const outDir = path.join(root, "public", "og");
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, "share-1200x630.png");

execFileSync(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--force-device-scale-factor=1",
  "--window-size=1200,630",
  `--screenshot=${out}`,
  `file://${source}`,
]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`Wrote ${out}`);
