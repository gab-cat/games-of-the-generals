import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { PUBLIC_PAGES } from "../src/lib/seo/pages";
import {
  findPage,
  renderHead,
  renderLlmsTxt,
  renderRobots,
  renderShell,
  renderSitemap,
} from "../src/lib/seo/render";

/*
 * index.html has two placeholders, <!--seo-head--> and <!--seo-shell-->. In dev
 * and build they are filled for the home page. After the build, each other
 * public page gets its own copy (dist/about.html, ...) with its own title,
 * description, canonical, share tags, schema and static content; vercel.json
 * rewrites /about to /about.html. The build also writes sitemap.xml,
 * robots.txt and llms.txt from the same page list.
 */

const HEAD = /<!--seo-head:start-->[\s\S]*?<!--seo-head:end-->/;
const SHELL = /<!--seo-shell:start-->[\s\S]*?<!--seo-shell:end-->/;

function headBlock(pagePath: string) {
  return `<!--seo-head:start-->\n    ${renderHead(findPage(pagePath))}\n    <!--seo-head:end-->`;
}

function shellBlock(pagePath: string) {
  return `<!--seo-shell:start-->${renderShell(findPage(pagePath))}<!--seo-shell:end-->`;
}

export function pageFileName(pagePath: string) {
  return pagePath === "/" ? "index.html" : `${pagePath.slice(1)}.html`;
}

export function seoPages(): Plugin {
  let outDir = "dist";
  return {
    name: "seo-pages",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        if (!html.includes("<!--seo-head-->") || !html.includes("<!--seo-shell-->")) {
          throw new Error("index.html is missing the <!--seo-head--> or <!--seo-shell--> placeholder");
        }
        // Function replacers, so `$` in the content is never read as a pattern.
        return html
          .replace("<!--seo-head-->", () => headBlock("/"))
          .replace("<!--seo-shell-->", () => shellBlock("/"));
      },
    },
    writeBundle() {
      const index = fs.readFileSync(path.join(outDir, "index.html"), "utf8");
      for (const page of PUBLIC_PAGES) {
        if (page.path === "/") continue;
        const html = index
          .replace(HEAD, () => headBlock(page.path))
          .replace(SHELL, () => shellBlock(page.path));
        fs.writeFileSync(path.join(outDir, pageFileName(page.path)), html);
      }
      fs.writeFileSync(path.join(outDir, "sitemap.xml"), renderSitemap());
      fs.writeFileSync(path.join(outDir, "robots.txt"), renderRobots());
      fs.writeFileSync(path.join(outDir, "llms.txt"), renderLlmsTxt());
    },
  };
}
