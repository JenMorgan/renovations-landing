/* Northline Renovations — client behaviour.
   Progressive enhancement only: every section is readable without this file. */
(function () {
  'use strict';

  var CFG = window.SITE_CONFIG || {};
  var T = CFG.strings || {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- language + mobile menus ---------- */

  var langToggle = $('[data-lang-toggle]');
  var langMenu = $('[data-lang-menu]');
  if (langToggle && langMenu) {
    langToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = langMenu.hidden;
      langMenu.hidden = !open;
      langToggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) {
      if (!langMenu.hidden && !langMenu.contains(e.target) && e.target !== langToggle) {
        langMenu.hidden = true;
        langToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var burger = $('[data-burger]');
  var mobileNav = $('[data-mobile-nav]');
  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      mobileNav.hidden = !mobileNav.hidden;
      burger.setAttribute('aria-expanded', String(!mobileNav.hidden));
    });
    $$('a', mobileNav).forEach(function (a) {
      a.addEventListener('click', function () {
        mobileNav.hidden = true;
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* remember the visitor's language choice so the root page can honour it */
  $$('[data-lang-code]').forEach(function (a) {
    a.addEventListener('click', function () {
      try { localStorage.setItem('preferredLocale', a.getAttribute('data-lang-code')); } catch (e) {}
    });
  });

  /* ---------- project filters ---------- */

  var filterBar = $('[data-filters]');
  if (filterBar) {
    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      var key = btn.getAttribute('data-filter');
      $$('button[data-filter]', filterBar).forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      var shown = 0;
      $$('[data-category]').forEach(function (card) {
        var match = key === 'all' || card.getAttribute('data-category') === key;
        card.hidden = !match;
        if (match) shown++;
      });
      var empty = $('[data-projects-empty]');
      if (empty) empty.hidden = shown !== 0;
    });
  }

  /* ---------- dialogs (estimate / feedback / lightbox) ---------- */

  function openDialog(dlg) {
    if (!dlg) return;
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
    var first = dlg.querySelector('input, select, textarea');
    if (first) setTimeout(function () { first.focus(); }, 60);
  }
  function closeDialog(dlg) {
    if (!dlg) return;
    if (typeof dlg.close === 'function') dlg.close();
    else dlg.removeAttribute('open');
  }

  $$('[data-open-dialog]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var id = btn.getAttribute('data-open-dialog');
      var dlg = document.getElementById(id);
      if (!dlg) return; // no dialog on this page — let the link fall through
      e.preventDefault();
      var preset = btn.getAttribute('data-preset');
      if (preset) {
        var field = dlg.querySelector('[name="project"]');
        if (field) field.value = preset;
      }
      openDialog(dlg);
    });
  });
  $$('[data-close-dialog]').forEach(function (btn) {
    btn.addEventListener('click', function () { closeDialog(btn.closest('dialog')); });
  });
  $$('dialog').forEach(function (dlg) {
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDialog(dlg); });
  });

  var lightbox = $('[data-lightbox]');
  if (lightbox) {
    var lbImg = $('img', lightbox);
    $$('[data-lightbox-src]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        lbImg.src = btn.getAttribute('data-lightbox-src');
        lbImg.alt = btn.getAttribute('data-lightbox-alt') || '';
        openDialog(lightbox);
      });
    });
  }

  /* ---------- star rating ---------- */

  $$('[data-rating]').forEach(function (group) {
    var input = $('input', group);
    var buttons = $$('button', group);
    function paint(value) {
      buttons.forEach(function (b, i) { b.setAttribute('data-on', String(i < value)); });
      if (input) input.value = String(value);
    }
    buttons.forEach(function (b, i) {
      b.addEventListener('click', function () { paint(i + 1); });
    });
    paint(Number(input && input.value) || 5);
  });

  /* ---------- forms ---------- */

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(field, message) {
    var scope = (field.closest && field.closest('.field')) || field.parentNode;
    var box = scope.querySelector('.field__error');
    if (box) box.textContent = message || '';
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
  }

  function validate(form) {
    var ok = true;
    var firstInvalid = null;
    $$('input, select, textarea', form).forEach(function (field) {
      if (field.type === 'hidden' || field.classList.contains('hp')) return;
      setError(field, '');
      var value = (field.value || '').trim();
      function fail(message) { setError(field, message); ok = false; firstInvalid = firstInvalid || field; }
      if (field.type === 'checkbox') {
        if (field.required && !field.checked) fail(T.requiredCheck || T.required || 'Required');
        return;
      }
      if (field.required && !value) { fail(T.required || 'Required'); return; }
      if (field.type === 'email' && value && !EMAIL_RE.test(value)) fail(T.invalidEmail || 'Invalid email');
    });
    if (firstInvalid) firstInvalid.focus();
    return ok;
  }

  function collect(form) {
    var out = {};
    new FormData(form).forEach(function (value, key) {
      if (key === 'botcheck' || key === '_gotcha') return;
      if (value instanceof File) { if (value.name) out[key] = value.name; return; }
      out[key] = out[key] ? out[key] + ', ' + value : value;
    });
    return out;
  }

  function labelFor(form, key) {
    var el = form.querySelector('[name="' + key + '"]');
    var label = el && el.closest('.field') && el.closest('.field').querySelector('label');
    return label ? label.textContent.replace(/\*$/, '').trim() : key;
  }

  function mailtoFallback(form, data, subject) {
    var lines = Object.keys(data).map(function (k) { return labelFor(form, k) + ': ' + data[k]; });
    lines.push('', '— ' + (CFG.brandName || '') + ' — ' + location.href);
    var href = 'mailto:' + encodeURIComponent(CFG.email || '') +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(lines.join('\n'));
    window.location.href = href;
  }

  function status(form, kind, text) {
    var box = $('[data-status]', form);
    if (!box) return;
    box.className = 'form__status' + (kind ? ' form__status--' + kind : '');
    box.textContent = text || '';
    box.setAttribute('role', kind === 'err' ? 'alert' : 'status');
  }

  $$('form[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) return;

      var kind = form.getAttribute('data-form');
      var submit = $('[type="submit"]', form);
      var originalLabel = submit ? submit.textContent : '';
      var data = collect(form);
      var subject = (kind === 'review' ? 'New feedback' : kind === 'estimate' ? 'Estimate request' : 'Website message') +
        ' — ' + (CFG.brandName || 'website') + (data.name ? ' (' + data.name + ')' : '');
      var cfg = CFG.forms || {};
      var configured = cfg.accessKey && cfg.accessKey.indexOf('PASTE') !== 0 && cfg.endpoint;

      if (!configured) { mailtoFallback(form, data, subject); status(form, 'ok', T.mailtoNotice || ''); return; }

      if (submit) { submit.disabled = true; submit.textContent = T.sending || 'Sending…'; }
      status(form, '', '');

      var payload = Object.assign({}, data, {
        access_key: cfg.accessKey,
        subject: subject,
        from_name: CFG.brandName || 'Website',
        replyto: data.email || '',
        page: location.href,
        form_type: kind
      });

      fetch(cfg.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json().catch(function () { return { success: res.ok }; }); })
        .then(function (res) {
          if (!res.success) throw new Error(res.message || 'failed');
          form.reset();
          $$('[data-rating] button', form).forEach(function (b) { b.setAttribute('data-on', 'true'); });
          status(form, 'ok', kind === 'review' ? (T.successReview || T.success) : T.success);
        })
        .catch(function () {
          status(form, 'err', (T.error || '').replace('{email}', CFG.email || ''));
        })
        .then(function () {
          if (submit) { submit.disabled = false; submit.textContent = originalLabel; }
        });
    });
  });

  /* ---------- reveal on scroll ---------- */

  var targets = $$('.reveal');
  if (targets.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- active nav link on scroll ---------- */

  var sections = $$('main section[id]');
  var navLinks = $$('.nav a[href^="#"]');
  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'page');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }
})();
