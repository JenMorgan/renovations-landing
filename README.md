# Renovations landing page

A fast, multilingual (English / Українська / Русский) landing page for a renovation
and construction business, with case studies, an estimate request form, a feedback
form, and a content editor for non-technical use.

No frameworks, no dependencies: `node build.mjs` turns the files in `content/` into
plain static HTML in `dist/`, which GitHub Pages serves.

```
content/            everything the site says (edit this)
  site.json         company name, contacts, where form submissions go
  locales/*.json    interface text for en / uk / ru
  projects.json     case studies
  reviews.json      published client feedback
  services.json  prices.json  advantages.json
  images/projects/  photos
src/                templates, stylesheet, client-side JavaScript
admin/              the content editor served at /admin/
build.mjs           the generator
dist/               build output (generated, not committed)
```

## 1. Turn on hosting (one switch, once)

The deploy workflow is already in the repository. GitHub needs to be told to use it:

**Settings → Pages → Build and deployment → Source: _GitHub Actions_**

Then push to `main` (or run the "Build and deploy" workflow manually from the Actions
tab). About a minute later the site is live at:

```
https://jenmorgan.github.io/renovations-landing/
```

Every later push to `main` — including saves from the content editor — rebuilds and
redeploys automatically.

### A custom domain (recommended)

A real domain like `northline-renovations.nl` ranks better and looks like a business.
Buy one, then in **Settings → Pages → Custom domain** enter it and follow the DNS
instructions. Afterwards change `site.url` in `content/site.json` to the same address,
because canonical links, `hreflang` tags and `sitemap.xml` are generated from it.

## 2. Make the forms deliver email

All three forms (estimate request, contact message, feedback) post to
[Web3Forms](https://web3forms.com), which is free and needs no server:

1. Enter the business email at web3forms.com and confirm it.
2. Copy the access key you receive.
3. Paste it into `content/site.json` → `forms.accessKey`, and set
   `contact.email` to the same address.

Until a real key is in place the forms still work: they fall back to opening the
visitor's email app with the message pre-filled, addressed to `contact.email`.

Any other endpoint works too — set `forms.endpoint` to a Formspree URL, a Google Apps
Script, or your own handler. The payload is JSON with one field per input plus
`subject`, `page` and `form_type`.

Submitted feedback arrives by email. To publish a review on the site, add it under
**Client feedback** in the editor (or in `content/reviews.json`) — nothing appears on
the page automatically, so nobody can post to the site directly.

## 3. Editing the content

### Option A — the editor at `/admin/`

`https://jenmorgan.github.io/renovations-landing/admin/` opens a form-based editor
([Sveltia CMS](https://github.com/sveltia/sveltia-cms)) for projects, photos, reviews,
prices and contact details. Saving commits to this repository and the site rebuilds.

Signing in needs one of the following, because GitHub Pages cannot run a login
service itself:

- **Personal access token** — in the editor choose to sign in with a token, and use a
  GitHub fine-grained token limited to this repository with *Contents: read and write*.
  Simplest option, nothing to deploy.
- **GitHub OAuth app** — host the small
  [Sveltia CMS authenticator](https://github.com/sveltia/sveltia-cms-auth) on
  Cloudflare Workers (free) and add `backend.base_url` to `admin/config.yml`. Nicer for
  several editors.
- Or move hosting to **Cloudflare Pages / Netlify**, where the login works out of the
  box. The build command there is `node build.mjs` and the output directory is `dist`.

### Option B — edit the files on github.com

Every editable string lives in `content/`. Open a file on GitHub, press the pencil
icon, commit — the site rebuilds. `EDITING.md` explains this in English, Ukrainian and
Russian.

### Photos

Put image files in `content/images/projects/` and reference them from
`content/projects.json` as `images/projects/your-file.jpg`.

- JPEG or WebP, about 1600 px wide, under ~400 KB each.
- The `.svg` files currently in that folder are placeholders — replace them.
- `hero.svg` is the big background image at the top of the page, `contact.svg` the one
  next to the contact form.

### Languages

`content/locales/en.json`, `uk.json`, `ru.json` hold the interface text. Content items
carry all three languages inline:

```json
"title": { "en": "Apartment in Amsterdam", "uk": "Квартира в Амстердамі", "ru": "Квартира в Амстердаме" }
```

A missing translation falls back to English. To drop or add a language, edit
`site.site.locales` in `content/site.json` (and add a matching file in
`content/locales/`). Each language is generated as its own indexable folder —
`/en/`, `/uk/`, `/ru/` — cross-linked with `hreflang`, and `/` redirects visitors to
the language their browser asks for.

## 4. Being found online

Already built in: per-language static HTML, `hreflang` alternates, canonical URLs,
`sitemap.xml`, `robots.txt`, Open Graph tags, and `GeneralContractor` /
`CreativeWork` structured data generated from `content/site.json`.

Worth doing by hand, in order of impact:

1. **Google Business Profile** — for a local trade this brings more work than the
   website itself. Same name, phone and address as `content/site.json`.
2. **Google Search Console** and **Bing Webmaster Tools** — add the domain, submit
   `https…/sitemap.xml`.
3. Fill in real `areaServed` cities, phone, and opening hours in `content/site.json`.
4. Replace the placeholder images with real project photos, and give each project a
   specific title ("Kitchen extension in Haarlem" beats "Project 4").
5. Ask happy clients for Google reviews, and add the good ones to the site too.

## 5. Working on it locally

```bash
node build.mjs           # build into dist/
node build.mjs --serve   # build, then serve on http://localhost:4173
node scripts/make-placeholders.mjs   # regenerate placeholder images
```

Node 18 or newer. There is nothing to install.
