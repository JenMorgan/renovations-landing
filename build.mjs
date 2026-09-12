#!/usr/bin/env node
/**
 * Static site generator for the renovations landing page.
 *
 *   node build.mjs            → builds into ./dist
 *   node build.mjs --serve    → builds, then serves ./dist on http://localhost:4173
 *
 * Everything the site shows comes from ./content. No dependencies.
 */
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import {
  layout, hero, projectsSection, servicesSection, pricesSection,
  whySection, reviewsSection, contactSection, projectBody, tr, esc,
} from './src/templates.mjs';

const OUT = 'dist';
const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));
/** Content lists are stored as { items: [...] } so the CMS can edit them;
 *  a bare array is accepted too. */
const readList = async (p) => {
  const data = await readJson(p);
  return Array.isArray(data) ? data : data.items || [];
};

const site = await readJson('content/site.json');
const services = await readList('content/services.json');
const prices = await readList('content/prices.json');
const advantages = await readList('content/advantages.json');
const projects = await readList('content/projects.json');
const reviews = await readList('content/reviews.json');

/** Fill gaps in a translation from the default language, so a key that was
 *  never translated (or was blanked in the editor) still shows something. */
const withFallback = (base, override) => {
  if (Array.isArray(base)) return Array.isArray(override) && override.length ? override : base;
  if (base && typeof base === 'object') {
    const out = { ...base };
    for (const [key, value] of Object.entries(base)) {
      out[key] = withFallback(value, override?.[key]);
    }
    for (const [key, value] of Object.entries(override || {})) {
      if (!(key in base)) out[key] = value;
    }
    return out;
  }
  return override === '' || override == null ? base : override;
};

const locales = site.site.locales;
const defaultLocale = site.site.defaultLocale;
const locale2t = {};
const baseStrings = await readJson(`content/locales/${defaultLocale}.json`);
for (const code of locales) {
  const own = code === defaultLocale ? baseStrings : await readJson(`content/locales/${code}.json`);
  locale2t[code] = withFallback(baseStrings, own);
}
site.localeMeta = locale2t;

/* A custom domain wins over the default Pages address: it becomes the origin
   for canonical links, hreflang and the sitemap, and GitHub Pages needs it in
   a CNAME file at the root of the published site. */
const customDomain = (site.site.customDomain || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
const ORIGIN = customDomain ? `https://${customDomain}` : site.site.url.replace(/\/+$/, '');
const abs = (p) => `${ORIGIN}/${p.replace(/^\/+/, '')}`;

const brandName = (locale) => tr(site.brand.name, locale);
const pageTitle = (locale) => `${brandName(locale)} — ${locale2t[locale].meta.title}`;

function alternatesFor(pageSuffix) {
  const list = locales.map((code) => ({ hreflang: code, href: abs(`${code}/${pageSuffix}`) }));
  list.push({ hreflang: 'x-default', href: abs(`${site.site.defaultLocale}/${pageSuffix}`) });
  return list;
}

/* ---------- structured data ---------- */

const localBusiness = (locale) => ({
  '@context': 'https://schema.org',
  '@type': 'GeneralContractor',
  name: brandName(locale),
  description: locale2t[locale].meta.description,
  url: abs(`${locale}/`),
  image: abs('images/projects/hero.svg'),
  telephone: site.contact.phone,
  email: site.contact.email,
  address: { '@type': 'PostalAddress', addressLocality: tr(site.contact.address, locale) },
  ...(site.contact.geo ? { geo: { '@type': 'GeoCoordinates', ...site.contact.geo } } : {}),
  areaServed: (site.contact.areaServed || []).map((n) => ({ '@type': 'Place', name: n })),
  openingHours: tr(site.contact.hours, locale),
  priceRange: '€€',
  makesOffer: services.map((s) => ({
    '@type': 'Offer',
    itemOffered: { '@type': 'Service', name: tr(s.title, locale), description: tr(s.text, locale) },
  })),
  inLanguage: locales,
});

const projectSchema = (locale, p) => ({
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: tr(p.title, locale),
  headline: tr(p.title, locale),
  description: tr(p.summary, locale),
  image: abs(p.cover),
  dateCreated: String(p.year),
  locationCreated: { '@type': 'Place', name: tr(p.location, locale) },
  creator: { '@type': 'GeneralContractor', name: brandName(locale), url: abs(`${locale}/`) },
  inLanguage: locale,
});

const breadcrumbs = (locale, p) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: brandName(locale), item: abs(`${locale}/`) },
    { '@type': 'ListItem', position: 2, name: tr(p.title, locale), item: abs(`${locale}/projects/${p.id}.html`) },
  ],
});

/* ---------- pages ---------- */

const urls = [];

async function emit(relPath, html) {
  const full = join(OUT, relPath);
  await mkdir(full.split('/').slice(0, -1).join('/') || OUT, { recursive: true });
  await writeFile(full, html);
}

async function buildHome(locale) {
  const t = locale2t[locale];
  const base = '../';
  const body = [
    hero({ locale, t, site, base }),
    projectsSection({ locale, t, site, base, projects }),
    servicesSection({ locale, t, services }),
    pricesSection({ locale, t, prices }),
    whySection({ locale, t, advantages }),
    reviewsSection({ locale, t, base, reviews }),
    contactSection({ locale, t, site, base }),
  ].join('\n');

  const html = layout({
    locale, t, site, base,
    title: pageTitle(locale),
    description: t.meta.description,
    canonical: abs(`${locale}/`),
    alternates: alternatesFor(''),
    body,
    jsonLd: [localBusiness(locale)],
    homeHref: 'index.html',
  });
  await emit(`${locale}/index.html`, html);
  urls.push({ loc: abs(`${locale}/`), priority: locale === site.site.defaultLocale ? '1.0' : '0.9' });
}

async function buildProject(locale, project) {
  const t = locale2t[locale];
  const base = '../../';
  const others = projects.filter((p) => p.id !== project.id).slice(0, 3);
  const html = layout({
    locale, t, site, base,
    title: `${tr(project.title, locale)} — ${brandName(locale)}`,
    description: tr(project.summary, locale),
    canonical: abs(`${locale}/projects/${project.id}.html`),
    alternates: alternatesFor(`projects/${project.id}.html`),
    body: projectBody({ locale, t, site, base, project, others }),
    jsonLd: [projectSchema(locale, project), breadcrumbs(locale, project)],
    homeHref: '../index.html',
  });
  await emit(`${locale}/projects/${project.id}.html`, html);
  urls.push({ loc: abs(`${locale}/projects/${project.id}.html`), priority: '0.7' });
}

/* language chooser at the root: works without JS, redirects with it */
function rootIndex() {
  const def = site.site.defaultLocale;
  const links = locales
    .map((c) => `<li><a href="${c}/" hreflang="${c}" lang="${c}">${esc(locale2t[c].nativeName)}</a></li>`)
    .join('');
  return `<!doctype html>
<html lang="${def}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pageTitle(def))}</title>
<meta name="description" content="${esc(locale2t[def].meta.description)}">
<link rel="canonical" href="${abs(`${def}/`)}">
${locales.map((c) => `<link rel="alternate" hreflang="${c}" href="${abs(`${c}/`)}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${abs(`${def}/`)}">
<meta http-equiv="refresh" content="0; url=${def}/">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<style>body{font-family:system-ui,sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;background:#f6f4f0;color:#1e211c}ul{list-style:none;padding:0;display:flex;gap:18px}a{color:#3b4a34}</style>
<script>
(function(){
  var supported = ${JSON.stringify(locales)};
  var stored = null;
  try { stored = localStorage.getItem('preferredLocale'); } catch (e) {}
  var wanted = [stored].concat(navigator.languages || [navigator.language || '']);
  for (var i = 0; i < wanted.length; i++) {
    var tag = String(wanted[i] || '').toLowerCase().split('-')[0];
    if (tag === 'ua') tag = 'uk';
    if (supported.indexOf(tag) > -1) { location.replace(tag + '/' + location.hash); return; }
  }
  location.replace('${def}/' + location.hash);
})();
</script>
</head>
<body>
<div>
  <h1>${esc(brandName(def))}</h1>
  <p>${esc(locale2t[def].meta.title)}</p>
  <ul>${links}</ul>
</div>
</body>
</html>`;
}

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#3b4a34"/><g fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"><path d="M6 15 16 7l10 8"/><path d="M9 14v11h14V14"/><path d="M13 25v-7h6v7"/></g></svg>`;

const buildSitemap = () => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

const robots = () => `User-agent: *
Allow: /

Sitemap: ${abs('sitemap.xml')}
`;

const notFound = () => {
  const def = site.site.defaultLocale;
  return `<!doctype html>
<html lang="${def}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>404 — ${esc(brandName(def))}</title><meta name="robots" content="noindex">
<style>body{font-family:system-ui,sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;background:#f6f4f0;color:#1e211c;text-align:center}a{color:#3b4a34}</style>
</head><body><div><h1>404</h1><p>${esc(locale2t[def].cta.back)}</p><p><a href="/${def}/">${esc(brandName(def))}</a></p></div></body></html>`;
};

/* ---------- run ---------- */

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const locale of locales) {
  await buildHome(locale);
  for (const project of projects) await buildProject(locale, project);
}

await mkdir(join(OUT, 'assets'), { recursive: true });
await cp('src/styles.css', join(OUT, 'assets/styles.css'));
await cp('src/app.js', join(OUT, 'assets/app.js'));
if (existsSync('content/images')) await cp('content/images', join(OUT, 'images'), { recursive: true });
if (existsSync('admin')) await cp('admin', join(OUT, 'admin'), { recursive: true });

await writeFile(join(OUT, 'index.html'), rootIndex());
await writeFile(join(OUT, 'favicon.svg'), favicon);
await writeFile(join(OUT, 'sitemap.xml'), buildSitemap());
await writeFile(join(OUT, 'robots.txt'), robots());
await writeFile(join(OUT, '404.html'), notFound());
await writeFile(join(OUT, '.nojekyll'), '');
if (customDomain) await writeFile(join(OUT, 'CNAME'), `${customDomain}\n`);

console.log(`Built ${urls.length} pages for [${locales.join(', ')}] into ./${OUT}`);
console.log(`Public address: ${ORIGIN}${customDomain ? ' (custom domain, CNAME written)' : ''}`);

/* ---------- optional dev server ---------- */

if (process.argv.includes('--serve')) {
  const port = Number(process.env.PORT || 4173);
  const types = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
    '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.webp': 'image/webp', '.yml': 'text/yaml',
  };
  createServer(async (req, res) => {
    let file = decodeURIComponent(req.url.split('?')[0]);
    if (file.endsWith('/')) file += 'index.html';
    const target = join(OUT, file);
    try {
      const data = await readFile(target);
      res.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(await readFile(join(OUT, '404.html')).catch(() => 'Not found'));
    }
  }).listen(port, () => console.log(`Serving ./${OUT} on http://localhost:${port}/`));
}
