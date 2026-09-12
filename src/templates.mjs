import { icon, starRow } from './icons.mjs';

/* ---------- small helpers ------------------------------------------------- */

export const esc = (v = '') =>
  String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Pick a localised value: {en,uk,ru} → string. Plain strings pass through. */
export const tr = (value, locale, fallback = 'en') => {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value;
  return value[locale] ?? value[fallback] ?? Object.values(value)[0] ?? '';
};

const path = (base, p) => `${base}${p}`;

/* ---------- head / layout ------------------------------------------------- */

const jsonLdBlock = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

export function layout({
  locale, t, site, base, title, description, canonical, alternates,
  body, jsonLd = [], homeHref = 'index.html',
}) {
  const lang = t.htmlLang || locale;
  return `<!doctype html>
<html lang="${lang}" dir="${t.dir || 'ltr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${t.meta?.keywords ? `<meta name="keywords" content="${esc(t.meta.keywords)}">` : ''}
<meta name="robots" content="index, follow">
<link rel="canonical" href="${esc(canonical)}">
${alternates.map((a) => `<link rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}">`).join('\n')}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(tr(site.brand.name, locale))}">
<meta property="og:locale" content="${lang}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(new URL('images/projects/hero.svg', site.site.url.replace(/\/?$/, '/')).href)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#3b4a34">
<link rel="icon" href="${path(base, 'favicon.svg')}" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap">
<link rel="stylesheet" href="${path(base, 'assets/styles.css')}">
<script>document.documentElement.classList.add('js');</script>
${jsonLd.map(jsonLdBlock).join('\n')}
</head>
<body>
<a class="skip" href="#main">${esc(t.cta.skipToContent)}</a>
${header({ locale, t, site, base, homeHref })}
<main id="main">
${body}
</main>
${footer({ locale, t, site, homeHref })}
${dialogs({ locale, t, site })}
<script>window.SITE_CONFIG=${JSON.stringify({
    brandName: tr(site.brand.name, locale),
    email: site.contact.email,
    forms: site.forms,
    strings: t.forms,
  }).replace(/</g, '\\u003c')};</script>
<script src="${path(base, 'assets/app.js')}" defer></script>
</body>
</html>`;
}

/* ---------- header / footer ----------------------------------------------- */

const NAV = ['services', 'projects', 'prices', 'reviews', 'contact'];

const brandBlock = (site, locale, href = '#top') => `<a class="brand" href="${href}" aria-label="${esc(tr(site.brand.name, locale))}">
  ${icon('logo')}
  <span>
    <span class="brand__name">${esc(tr(site.brand.name, locale))}</span><br>
    <span class="brand__tag">${esc(tr(site.brand.tagline, locale))}</span>
  </span>
</a>`;

function langSwitcher({ locale, t, site, base }) {
  const items = site.site.locales.map((code) => {
    const meta = site.localeMeta[code];
    const current = code === locale;
    return `<a href="${base}${code}/" data-lang-code="${code}" hreflang="${code}" lang="${code}" aria-current="${current}">
      <span>${esc(meta.nativeName)}</span>${current ? icon('check') : ''}
    </a>`;
  }).join('\n');
  return `<div class="lang">
  <button class="lang__toggle" type="button" data-lang-toggle aria-expanded="false" aria-haspopup="true" aria-label="${esc(t.a11y.langSwitcher)}">
    ${icon('globe')}<span>${locale}</span>${icon('chevron')}
  </button>
  <div class="lang__menu" data-lang-menu hidden>${items}</div>
</div>`;
}

export function header({ locale, t, site, base, homeHref }) {
  const navBase = homeHref === 'index.html' ? '' : homeHref;
  const links = NAV.map((k) => `<a href="${navBase}#${k}">${esc(t.nav[k])}</a>`).join('\n');
  // the language switcher must point at sibling locale folders, one level up
  const langBase = homeHref === 'index.html' ? '../' : '../../';
  return `<header class="site-header" id="top">
  <div class="wrap site-header__inner">
    ${brandBlock(site, locale, `${navBase}#top`)}
    <nav class="nav" aria-label="${esc(t.a11y.menu)}">${links}</nav>
    <div class="header-actions">
      ${langSwitcher({ locale, t, site, base: langBase })}
      <button class="btn btn--cta" type="button" data-open-dialog="estimate-dialog">${esc(t.cta.estimate)}</button>
      <button class="burger" type="button" data-burger aria-expanded="false" aria-label="${esc(t.a11y.menu)}">${icon('menu')}</button>
    </div>
  </div>
  <div class="mobile-nav" data-mobile-nav hidden>
    ${links}
    <button class="btn btn--block" type="button" data-open-dialog="estimate-dialog">${esc(t.cta.estimate)}</button>
  </div>
</header>`;
}

export function footer({ locale, t, site, homeHref }) {
  const navBase = homeHref === 'index.html' ? '' : homeHref;
  return `<footer class="site-footer">
  <div class="wrap site-footer__inner">
    ${brandBlock(site, locale, `${navBase}#top`)}
    <nav aria-label="${esc(t.nav.contact)}">${NAV.map((k) => `<a href="${navBase}#${k}">${esc(t.nav[k])}</a>`).join('')}</nav>
    <div class="site-footer__legal">
      © ${new Date().getFullYear()} ${esc(tr(site.brand.name, locale))}<br>${esc(t.footer.rights)}
    </div>
  </div>
</footer>`;
}

/* ---------- sections ------------------------------------------------------ */

export function hero({ locale, t, site, base }) {
  const stats = site.stats.map((s) => `<div class="stat">
    ${icon(s.icon)}
    <div>
      <div class="stat__value">${esc(tr(s.value, locale))}</div>
      <div class="stat__label">${esc(tr(s.label, locale))}</div>
    </div>
  </div>`).join('\n');
  return `<section class="hero">
  <div class="hero__media">
    <img src="${path(base, 'images/projects/hero.svg')}" alt="" width="1600" height="900" fetchpriority="high">
  </div>
  <div class="wrap hero__inner">
    <h1 class="h-display hero__title">${esc(t.hero.line1)}<br>${esc(t.hero.line2)}</h1>
    <p class="hero__sub">${esc(t.hero.subtitle)}</p>
    <div class="hero__cta">
      <button class="btn" type="button" data-open-dialog="estimate-dialog">${esc(t.cta.estimate)}</button>
      <a class="btn btn--on-dark" href="#projects">${esc(t.cta.viewProjects)}</a>
    </div>
    <div class="hero__stats">${stats}</div>
  </div>
</section>`;
}

export function projectsSection({ locale, t, site, base, projects }) {
  const cats = ['all', ...new Set(projects.map((p) => p.category))];
  const filters = cats
    .map((c) => `<button type="button" data-filter="${c}" aria-pressed="${c === 'all'}">${esc(t.filters[c] || c)}</button>`)
    .join('');
  const cards = projects.map((p) => `<article class="project-card reveal" data-category="${esc(p.category)}">
    <a class="project-card__media" href="${path(base, `${locale}/projects/${p.id}.html`)}">
      <img src="${path(base, p.cover)}" alt="${esc(tr(p.title, locale))}" width="1200" height="900" loading="lazy">
    </a>
    <div class="project-card__body">
      <h3 class="project-card__title"><a href="${path(base, `${locale}/projects/${p.id}.html`)}">${esc(tr(p.title, locale))}</a></h3>
      <p class="project-card__meta">${esc(tr(p.subtitle, locale))}</p>
      <a class="link-arrow" href="${path(base, `${locale}/projects/${p.id}.html`)}">${esc(t.cta.viewProject)} ${icon('arrow')}</a>
    </div>
  </article>`).join('\n');
  return `<section class="section" id="projects">
  <div class="wrap">
    <div class="section__head">
      <h2 class="section-title">${esc(t.sections.projects.title)}</h2>
      <div class="filters" data-filters>${filters}</div>
    </div>
    <div class="project-grid">${cards}</div>
    <p class="project-empty" data-projects-empty hidden>${esc(t.sections.projects.subtitle)}</p>
  </div>
</section>`;
}

export function servicesSection({ locale, t, services }) {
  return `<section class="section" id="services">
  <div class="wrap">
    <div class="section__head"><h2 class="section-title">${esc(t.sections.services.title)}</h2></div>
    <div class="col-grid">
      ${services.map((s) => `<div class="feature reveal">
        ${icon(s.icon)}
        <h3 class="feature__title">${esc(tr(s.title, locale))}</h3>
        <p class="feature__text">${esc(tr(s.text, locale))}</p>
      </div>`).join('\n')}
    </div>
  </div>
</section>`;
}

export function pricesSection({ locale, t, prices }) {
  return `<section class="section section--warm" id="prices">
  <div class="wrap">
    <div class="section__head"><h2 class="section-title">${esc(t.sections.prices.title)}</h2></div>
    <div class="price-table">
      ${prices.map((p) => `<div class="price-cell">
        <div class="price-cell__label">${esc(tr(p.label, locale))}</div>
        <div class="price-cell__value">${esc(t.prices.from)} <b>${esc(p.price)}</b>${p.unit === 'perSqm' ? ` ${esc(t.prices.perSqm)}` : ''}</div>
      </div>`).join('\n')}
    </div>
    <p class="price-note">${esc(t.sections.prices.note)}</p>
    <div class="center-cta">
      <button class="btn" type="button" data-open-dialog="estimate-dialog">${esc(t.cta.exactEstimate)}</button>
    </div>
  </div>
</section>`;
}

export function whySection({ locale, t, advantages }) {
  return `<section class="section" id="about">
  <div class="wrap">
    <div class="section__head"><h2 class="section-title">${esc(t.sections.why.title)}</h2></div>
    <div class="col-grid">
      ${advantages.map((a) => `<div class="feature reveal">
        ${icon(a.icon)}
        <h3 class="feature__title">${esc(tr(a.title, locale))}</h3>
        <p class="feature__text">${esc(tr(a.text, locale))}</p>
      </div>`).join('\n')}
    </div>
  </div>
</section>`;
}

export function reviewsSection({ locale, t, base, reviews }) {
  return `<section class="section section--warm" id="reviews">
  <div class="wrap">
    <div class="section__head"><h2 class="section-title">${esc(t.sections.reviews.title)}</h2></div>
    <div class="review-grid">
      ${reviews.map((r) => `<figure class="review reveal">
        ${r.photo ? `<div class="review__photo"><img src="${path(base, r.photo)}" alt="" width="1200" height="900" loading="lazy"></div>` : ''}
        <div class="review__body">
          ${r.rating ? starRow(r.rating) : ''}
          <blockquote class="review__text">${esc(tr(r.text, locale))}</blockquote>
          <figcaption class="review__author">${esc(tr(r.author, locale))}</figcaption>
        </div>
      </figure>`).join('\n')}
    </div>
    <div class="center-cta">
      <button class="btn btn--ghost" type="button" data-open-dialog="review-dialog">${esc(t.cta.leaveReview)}</button>
    </div>
  </div>
</section>`;
}

/* ---------- forms --------------------------------------------------------- */

const field = ({ name, label, type = 'text', required, placeholder, autocomplete, rows }) => {
  const common = `id="f-${name}" name="${name}"${required ? ' required' : ''}${placeholder ? ` placeholder="${esc(placeholder)}"` : ''}${autocomplete ? ` autocomplete="${autocomplete}"` : ''}`;
  const control = type === 'textarea'
    ? `<textarea ${common} rows="${rows || 4}"></textarea>`
    : `<input type="${type}" ${common}>`;
  return `<div class="field">
    <label for="f-${name}">${esc(label)}${required ? ' *' : ''}</label>
    ${control}
    <div class="field__error"></div>
  </div>`;
};

const selectField = ({ name, label, placeholder, options, required }) => `<div class="field">
  <label for="f-${name}">${esc(label)}${required ? ' *' : ''}</label>
  <select id="f-${name}" name="${name}"${required ? ' required' : ''}>
    <option value="">${esc(placeholder)}</option>
    ${options.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}
  </select>
  <div class="field__error"></div>
</div>`;

const honeypot = `<input class="hp" type="checkbox" name="botcheck" tabindex="-1" aria-hidden="true">`;

export function contactForm({ t, variant = 'contact', cardClass = 'form--card' }) {
  const f = t.forms;
  return `<form class="form ${cardClass}" data-form="${variant}" novalidate>
  ${field({ name: 'name', label: f.name, required: true, autocomplete: 'name' })}
  <div class="field-row">
    ${field({ name: 'phone', label: f.phone, type: 'tel', required: true, autocomplete: 'tel' })}
    ${field({ name: 'email', label: f.email, type: 'email', required: true, autocomplete: 'email' })}
  </div>
  ${field({ name: 'message', label: f.message, type: 'textarea', rows: 4 })}
  <div class="field">
    <label class="consent"><input type="checkbox" name="consent" value="yes" required><span>${esc(f.consent)}</span></label>
    <div class="field__error"></div>
  </div>
  ${honeypot}
  <div class="form__status" data-status></div>
  <button class="btn btn--block" type="submit">${esc(t.cta.send)}</button>
  <p class="form__note">${esc(t.footer.privacy)}</p>
</form>`;
}

export function estimateForm({ t }) {
  const f = t.forms;
  return `<form class="form" data-form="estimate" novalidate>
  ${field({ name: 'name', label: f.name, required: true, autocomplete: 'name' })}
  <div class="field-row">
    ${field({ name: 'phone', label: f.phone, type: 'tel', required: true, autocomplete: 'tel' })}
    ${field({ name: 'email', label: f.email, type: 'email', required: true, autocomplete: 'email' })}
  </div>
  <div class="field-row">
    ${selectField({ name: 'project', label: f.projectType, placeholder: f.projectTypePlaceholder, options: f.options.type, required: true })}
    ${field({ name: 'area', label: f.area, type: 'number' })}
  </div>
  <div class="field-row">
    ${selectField({ name: 'budget', label: f.budget, placeholder: f.budgetPlaceholder, options: f.options.budget })}
    ${selectField({ name: 'timeline', label: f.timeline, placeholder: f.timelinePlaceholder || f.budgetPlaceholder, options: f.options.timeline })}
  </div>
  ${field({ name: 'message', label: f.message, type: 'textarea', rows: 3 })}
  <div class="field">
    <label class="consent"><input type="checkbox" name="consent" value="yes" required><span>${esc(f.consent)}</span></label>
    <div class="field__error"></div>
  </div>
  ${honeypot}
  <div class="form__status" data-status></div>
  <button class="btn btn--block" type="submit">${esc(t.cta.send)}</button>
  <p class="form__note">${esc(t.footer.privacy)}</p>
</form>`;
}

export function reviewForm({ t }) {
  const f = t.forms;
  return `<form class="form" data-form="review" novalidate>
  ${field({ name: 'name', label: f.name, required: true, autocomplete: 'name' })}
  <div class="field-row">
    ${field({ name: 'city', label: f.city })}
    ${field({ name: 'email', label: f.email, type: 'email', autocomplete: 'email' })}
  </div>
  <div class="field">
    <label for="f-rating">${esc(f.rating)}</label>
    <div class="rating-input" data-rating>
      <input type="hidden" name="rating" id="f-rating" value="5">
      ${[1, 2, 3, 4, 5].map((n) => `<button type="button" aria-label="${n}"><svg class="star" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4 2.4 5 5.6.8-4 3.9 1 5.5L12 16.6 7 19.2l1-5.5-4-3.9L9.6 9z" fill="currentColor"/></svg></button>`).join('')}
    </div>
  </div>
  ${field({ name: 'message', label: f.reviewMessage, type: 'textarea', required: true, rows: 4 })}
  <div class="field">
    <label class="consent"><input type="checkbox" name="publish_consent" value="yes"><span>${esc(f.publishConsent || f.consent)}</span></label>
  </div>
  ${honeypot}
  <div class="form__status" data-status></div>
  <button class="btn btn--block" type="submit">${esc(t.cta.send)}</button>
</form>`;
}

export function contactSection({ locale, t, site, base }) {
  const c = site.contact;
  const rows = [
    c.phone && `<a href="tel:${esc(c.phone.replace(/\s/g, ''))}">${icon('phone')}<span>${esc(c.phone)}</span></a>`,
    c.email && `<a href="mailto:${esc(c.email)}">${icon('mail')}<span>${esc(c.email)}</span></a>`,
    c.address && `<span>${icon('pin')}<span>${esc(tr(c.address, locale))}</span></span>`,
    c.hours && `<span>${icon('clock')}<span>${esc(tr(c.hours, locale))}</span></span>`,
  ].filter(Boolean).join('\n');
  return `<section class="contact" id="contact">
  <div class="contact__grid">
    <div class="contact__aside">
      <div class="wrap contact__inner">
        <div>
          <h2 class="contact__title">${esc(t.sections.contact.title)}</h2>
          <p class="contact__sub">${esc(t.sections.contact.subtitle)}</p>
          <div class="contact-list">${rows}</div>
          ${c.whatsapp ? `<a class="btn btn--ghost" href="https://wa.me/${esc(c.whatsapp)}" target="_blank" rel="noopener">${icon('whatsapp')} ${esc(t.cta.whatsapp)}</a>` : ''}
        </div>
        ${contactForm({ t })}
      </div>
    </div>
    <div class="contact__media">
      <img src="${path(base, 'images/projects/contact.svg')}" alt="" width="1200" height="900" loading="lazy">
    </div>
  </div>
</section>`;
}

/* ---------- dialogs ------------------------------------------------------- */

export function dialogs({ t }) {
  const f = t.forms;
  const shell = (id, title, sub, form) => `<dialog class="modal" id="${id}" aria-labelledby="${id}-title">
  <div class="modal__panel">
    <div class="modal__head">
      <h2 class="modal__title" id="${id}-title">${esc(title)}</h2>
      <button class="modal__close" type="button" data-close-dialog aria-label="${esc(t.cta.close)}">${icon('close')}</button>
    </div>
    <p class="modal__sub">${esc(sub)}</p>
    ${form}
  </div>
</dialog>`;
  return [
    shell('estimate-dialog', f.estimateTitle, f.estimateSubtitle, estimateForm({ t })),
    shell('review-dialog', f.reviewTitle, f.reviewSubtitle, reviewForm({ t })),
  ].join('\n');
}

/* ---------- project detail page ------------------------------------------- */

export function projectBody({ locale, t, site, base, project, others }) {
  const p = project;
  const spec = [
    [t.project.location, tr(p.location, locale)],
    [t.project.year, p.year],
    [t.project.area, p.area],
    [t.project.duration, tr(p.duration, locale)],
    [t.project.budget, p.budget],
  ].filter(([, v]) => v);
  const scope = tr(p.scope, locale) || [];
  return `<div class="wrap">
  <p class="crumbs"><a href="${base}${locale}/">${esc(tr(site.brand.name, locale))}</a> / ${esc(tr(p.title, locale))}</p>
  <div class="project-hero">
    <p class="eyebrow">${esc(tr(p.subtitle, locale))}</p>
    <h1 class="project-hero__title">${esc(tr(p.title, locale))}</h1>
    <p class="project-hero__sub">${esc(tr(p.summary, locale))}</p>
  </div>
  <div class="project-cover"><img src="${path(base, p.cover)}" alt="${esc(tr(p.title, locale))}" width="1200" height="900"></div>
  <dl class="spec">${spec.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>

  <div class="case">
    <div>
      <h2>${esc(t.project.challenge)}</h2><p>${esc(tr(p.challenge, locale))}</p>
      <h2>${esc(t.project.solution)}</h2><p>${esc(tr(p.solution, locale))}</p>
      <h2>${esc(t.project.result)}</h2><p>${esc(tr(p.result, locale))}</p>
      ${p.gallery?.length ? `<h2>${esc(t.project.gallery)}</h2>
      <div class="gallery">${p.gallery.map((g, i) => `<button type="button" data-lightbox-src="${path(base, g)}" data-lightbox-alt="${esc(tr(p.title, locale))} ${i + 1}">
        <img src="${path(base, g)}" alt="${esc(tr(p.title, locale))} ${i + 1}" width="1200" height="900" loading="lazy">
      </button>`).join('')}</div>` : ''}
    </div>
    <aside class="case__aside">
      <h2>${esc(t.project.scope)}</h2>
      <ul class="scope-list">${(Array.isArray(scope) ? scope : []).map((s) => `<li>${icon('check')}<span>${esc(s)}</span></li>`).join('')}</ul>
      <button class="btn btn--block" type="button" style="margin-top:22px" data-open-dialog="estimate-dialog" data-preset="${esc((t.forms.options.type || [])[0] || '')}">${esc(t.project.requestSimilar)}</button>
    </aside>
  </div>

  ${others.length ? `<section class="section">
    <div class="section__head"><h2 class="section-title">${esc(t.project.similar)}</h2></div>
    <div class="project-grid">
      ${others.map((o) => `<article class="project-card">
        <a class="project-card__media" href="${o.id}.html"><img src="${path(base, o.cover)}" alt="${esc(tr(o.title, locale))}" width="1200" height="900" loading="lazy"></a>
        <div class="project-card__body">
          <h3 class="project-card__title"><a href="${o.id}.html">${esc(tr(o.title, locale))}</a></h3>
          <p class="project-card__meta">${esc(tr(o.subtitle, locale))}</p>
        </div>
      </article>`).join('')}
    </div>
  </section>` : ''}
</div>

<section class="cta-band">
  <div class="wrap cta-band__inner">
    <div>
      <h2>${esc(t.sections.contact.title)}</h2>
      <p>${esc(t.sections.contact.subtitle)}</p>
    </div>
    <button class="btn btn--on-dark" type="button" data-open-dialog="estimate-dialog">${esc(t.cta.estimate)}</button>
  </div>
</section>

<dialog class="lightbox" data-lightbox>
  <div class="lightbox__bar"><button type="button" data-close-dialog aria-label="${esc(t.cta.close)}">${icon('close')}</button></div>
  <img src="" alt="">
</dialog>`;
}
