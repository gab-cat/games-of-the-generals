import fs from 'fs';
import path from 'path';

/**
 * Generate sitemap.xml and robots.txt based on file routes in src/routes
 */
async function main() {
  const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  const routesDir = path.join(projectRoot, 'src', 'routes');
  const publicDir = path.join(projectRoot, 'public');

  const siteUrlRaw = process.env.SITE_URL || process.env.VERCEL_URL || 'http://localhost:5173';
  const siteUrl = normalizeSiteUrl(siteUrlRaw);

  const routes = await collectStaticRoutes(routesDir);

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const sitemapXml = buildSitemapXml(siteUrl, routes);
  const robotsTxt = buildRobotsTxt(siteUrl);

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf8');

   
  console.log(`Generated sitemap with ${routes.length} routes at ${path.join(publicDir, 'sitemap.xml')}`);
}

function normalizeSiteUrl(input) {
  if (!input) return 'http://localhost:5173';
  // If env provides just the domain (e.g. my-app.vercel.app), add https://
  if (!/^https?:\/\//i.test(input)) {
    return `https://${input}`;
  }
  return input.replace(/\/$/, '');
}

async function collectStaticRoutes(routesDir) {
  const entries = fs.readdirSync(routesDir, { withFileTypes: true });
  const routes = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Support nested routes if present (not used currently)
      const nested = await collectStaticRoutes(path.join(routesDir, entry.name));
      routes.push(...nested.map((r) => `/${entry.name}${r === '/' ? '' : r}`));
      continue;
    }

    if (!entry.name.endsWith('.tsx')) continue;

    const base = entry.name.replace(/\.tsx$/, '');

    // Skip special or dynamic routes
    if (base === '__root__' || base === '__root' || base === '$' || base.includes('[')) continue;

    if (base === 'index') {
      routes.push('/');
    } else {
      routes.push(`/${base}`);
    }
  }

  // Ensure unique & sorted
  return Array.from(new Set(routes)).sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)));
}

function buildSitemapXml(siteUrl, routes) {
  const now = new Date().toISOString();
  const urlEntries = routes
    .map((route) => {
      const loc = `${siteUrl}${route}`;
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${route === '/' ? '1.0' : '0.7'}</priority>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urlEntries}\n` +
    `</urlset>\n`;
}

function buildRobotsTxt(siteUrl) {
  const sitemapUrl = `${siteUrl}/sitemap.xml`;
  return `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

main().catch((err) => {
   
  console.error(err);
  process.exit(1);
});


