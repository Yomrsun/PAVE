/* PAVE homepage — interactions. No dependencies. */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.remove('no-js');
  var CONFIG = window.PAVE_CONFIG || {};
  var CALENDLY = CONFIG.calendlyUrl || 'https://calendly.com/pavemarketingcalendar/30min';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- analytics hook (GTM / GA4 read window.dataLayer) ---------- */
  window.dataLayer = window.dataLayer || [];
  function track(event, props) {
    try { window.dataLayer.push(Object.assign({ event: event }, props || {})); } catch (e) { /* noop */ }
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-cta]');
    if (el) track('cta_click', { cta_location: el.getAttribute('data-cta'), cta_text: el.textContent.trim().slice(0, 60) });
  });

  /* ---------- storage (may be blocked) ---------- */
  function store(k, v) { try { if (v === undefined) return window.sessionStorage.getItem(k); window.sessionStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- booking URL: UTMs + prefill ---------- */
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var pageParams = new URLSearchParams(window.location.search);
  function bookingUrl(extra) {
    var url;
    try { url = new URL(CALENDLY); } catch (e) { return CALENDLY; }
    UTM_KEYS.forEach(function (k) { if (pageParams.get(k)) url.searchParams.set(k, pageParams.get(k)); });
    if (!url.searchParams.get('utm_source')) url.searchParams.set('utm_source', 'pave.agency');
    if (!url.searchParams.get('utm_medium')) url.searchParams.set('utm_medium', 'homepage');
    if (extra) Object.keys(extra).forEach(function (k) { if (extra[k]) url.searchParams.set(k, extra[k]); });
    return url.toString();
  }

  var calendlyLoading = null;
  function loadCalendly() {
    if (window.Calendly) return Promise.resolve(window.Calendly);
    if (calendlyLoading) return calendlyLoading;
    calendlyLoading = new Promise(function (resolve, reject) {
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(css);
      var s = document.createElement('script');
      s.src = 'https://assets.calendly.com/assets/external/widget.js';
      s.async = true;
      s.onload = function () { window.Calendly ? resolve(window.Calendly) : reject(new Error('no Calendly')); };
      s.onerror = reject;
      document.head.appendChild(s);
      setTimeout(function () { if (!window.Calendly) reject(new Error('timeout')); }, 8000);
    });
    return calendlyLoading;
  }

  function openBooking(extra, source) {
    var url = bookingUrl(extra);
    track('book_call_click', { cta_location: source || 'unknown' });
    if (window.innerWidth < 720) { window.open(url, '_blank', 'noopener'); return; }
    loadCalendly().then(function (C) { C.initPopupWidget({ url: url }); })
      .catch(function () { window.open(url, '_blank', 'noopener'); });
  }

  // direct Calendly links (fallback button inside #book)
  document.querySelectorAll('[data-book]').forEach(function (el) {
    el.setAttribute('href', bookingUrl());
    el.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      openBooking(null, el.getAttribute('data-book'));
    });
  });

  document.querySelectorAll('[data-book-tab]').forEach(function (el) {
    el.setAttribute('href', bookingUrl());
    el.addEventListener('click', function () { track('book_call_click', { cta_location: 'calendar-new-tab' }); });
  });

  // inline calendar, loaded when #book approaches the viewport
  var slot = document.querySelector('[data-calendly]');
  function embedCalendar() {
    if (!slot || slot.classList.contains('is-embedded') || CONFIG.calendlyInline === false) return;
    loadCalendly().then(function (C) {
      var holder = document.createElement('div');
      holder.className = 'calendly-inline-widget';
      slot.appendChild(holder);
      var u = new URL(bookingUrl());
      u.searchParams.set('hide_gdpr_banner', '1');
      u.searchParams.set('background_color', 'fffdf9');
      u.searchParams.set('text_color', '0e0c0b');
      u.searchParams.set('primary_color', 'f58659');
      C.initInlineWidget({ url: u.toString(), parentElement: holder });
      slot.classList.add('is-embedded');
      track('calendar_embedded');
    }).catch(function () { /* fallback button stays visible */ });
  }
  if (slot) {
    if (hasIO) {
      var calIO = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { embedCalendar(); calIO.disconnect(); }
      }, { rootMargin: '900px 0px' });
      calIO.observe(slot);
    }
    // anyone who clicks a #book CTA gets the calendar right away
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href="#book"]');
      if (a) { embedCalendar(); track('book_anchor_click', { cta_location: a.getAttribute('data-cta') || '' }); }
    });
  }

  window.addEventListener('message', function (e) {
    if (!e.data || typeof e.data.event !== 'string' || e.data.event.indexOf('calendly.') !== 0) return;
    if (e.data.event === 'calendly.date_and_time_selected') track('call_time_selected');
    if (e.data.event === 'calendly.event_scheduled') track('call_booked', { source: 'calendly' });
  });

  /* ---------- announcement bar ---------- */
  var announce = document.getElementById('announce');
  if (announce) {
    if (store('pave_announce_closed') === '1') announce.hidden = true;
    var closeBtn = announce.querySelector('.announce__close');
    if (closeBtn) closeBtn.addEventListener('click', function () { announce.hidden = true; store('pave_announce_closed', '1'); });
  }

  /* ---------- nav ---------- */
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav__toggle');
  var menu = document.getElementById('mobile-menu');
  function setMenu(open) {
    if (!nav) return;
    nav.classList.toggle('is-open', open);
    if (toggle) { toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Close menu' : 'Menu'); }
    if (menu) { if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', ''); }
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (menu) {
    menu.setAttribute('inert', '');
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  }
  if (toggle) toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
  window.addEventListener('resize', function () { if (window.innerWidth > 1180 && nav && nav.classList.contains('is-open')) setMenu(false); });

  function onScroll() { if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // sticky mobile CTA: after the hero, hidden while #book or the form is on screen
  var sticky = document.querySelector('.sticky-cta');
  if (sticky && hasIO) {
    var heroGone = false, hideFor = new Set();
    var upd = function () { sticky.classList.toggle('is-on', heroGone && hideFor.size === 0); };
    var hero = document.querySelector('.hero');
    if (hero) new IntersectionObserver(function (en) { heroGone = !en[0].isIntersecting; upd(); }).observe(hero);
    ['book', 'contact'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      new IntersectionObserver(function (en) { if (en[0].isIntersecting) hideFor.add(id); else hideFor.delete(id); upd(); }, { threshold: 0.05 }).observe(el);
    });
  }

  /* ---------- load + reveal ---------- */
  requestAnimationFrame(function () { requestAnimationFrame(function () { doc.classList.add('is-loaded'); }); });

  var revealEls = document.querySelectorAll('.reveal, [data-observe]');
  if (hasIO && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- count-up numbers ---------- */
  function runCounter(el) {
    var raw = el.getAttribute('data-count');
    var target = parseFloat(raw);
    var decimals = (raw.split('.')[1] || '').length;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / 1400, 1);
      var v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = prefix + v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (hasIO && !reduceMotion) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-count]').forEach(function (el) { cio.observe(el); });
  }

  /* ---------- bar charts (indexed to baseline = 100) ---------- */
  function fillBars(chart) {
    var before = parseFloat(chart.getAttribute('data-before') || '100');
    var after = parseFloat(chart.getAttribute('data-after') || '100');
    var max = Math.max(before, after);
    var b = chart.querySelector('.bar--before i');
    var a = chart.querySelector('.bar--after i');
    if (b) b.style.height = Math.max(3, before / max * 78) + '%';
    if (a) a.style.height = Math.max(3, after / max * 78) + '%';
  }
  var charts = document.querySelectorAll('.bars');
  if (hasIO && !reduceMotion) {
    var bio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { fillBars(en.target); bio.unobserve(en.target); } });
    }, { threshold: 0.4 });
    charts.forEach(function (c) { bio.observe(c); });
  } else {
    charts.forEach(fillBars);
  }

  /* ---------- marquee: duplicate the group for a seamless loop ---------- */
  document.querySelectorAll('.marquee__track').forEach(function (track) {
    var group = track.querySelector('.marquee__group');
    if (!group) return;
    var clone = group.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('img').forEach(function (n) { n.alt = ''; });
    track.appendChild(clone);
  });

  /* ---------- services: accordion + cursor-follow proof chip ---------- */
  var svcs = document.querySelectorAll('.svc');
  svcs.forEach(function (svc) {
    var btn = svc.querySelector('.svc__row');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var open = !svc.classList.contains('is-open');
      svc.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      if (open) track('service_open', { service: svc.getAttribute('data-name') || '' });
    });
  });

  var chip = document.querySelector('.svc-cursor');
  var list = document.querySelector('.svc-list');
  if (chip && list && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion) {
    var chipB = chip.querySelector('b'), chipS = chip.querySelector('span');
    var mx = 0, my = 0, cx = 0, cy = 0, raf = null, active = false;
    var loop = function () {
      cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
      var x = Math.min(cx + 28, window.innerWidth - 260);
      chip.style.transform = 'translate3d(' + x + 'px,' + (cy - 40) + 'px,0)';
      raf = active ? requestAnimationFrame(loop) : null;
    };
    list.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!active) { active = true; cx = mx; cy = my; }
      if (!raf) raf = requestAnimationFrame(loop);
    });
    list.addEventListener('mouseleave', function () { active = false; chip.classList.remove('is-on'); });
    svcs.forEach(function (svc) {
      var row = svc.querySelector('.svc__row');
      row.addEventListener('mouseenter', function () {
        chipB.textContent = svc.getAttribute('data-stat') || '';
        chipS.textContent = svc.getAttribute('data-stat-label') || '';
        chip.classList.add('is-on');
      });
      row.addEventListener('mouseleave', function () { chip.classList.remove('is-on'); });
    });
  }

  /* ---------- results filter ---------- */
  var filterBtns = document.querySelectorAll('[data-filter]');
  var cases = document.querySelectorAll('.case[data-tags]');
  var liveRegion = document.getElementById('results-status');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      var shown = 0;
      cases.forEach(function (c) {
        var match = f === 'all' || c.getAttribute('data-tags').split(' ').indexOf(f) > -1;
        c.hidden = !match;
        if (match) {
          shown++;
          c.classList.add('is-in');
          var chart = c.querySelector('.bars');
          if (chart) fillBars(chart);
        }
      });
      if (liveRegion) liveRegion.textContent = 'Showing ' + shown + ' case ' + (shown === 1 ? 'study' : 'studies');
      track('results_filter', { filter: f });
    });
  });

  /* ---------- FAQ analytics ---------- */
  document.querySelectorAll('.faq-list details').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) track('faq_open', { question: d.querySelector('summary').textContent.trim().slice(0, 80) });
    });
  });

  /* ---------- lead form ---------- */
  var form = document.getElementById('lead-form');
  if (form) {
    var errorBox = form.querySelector('.form__error');
    var site = form.querySelector('input[name="website"]');

    // "Prepare my Snapshot" controls whether competitors are required
    form.querySelectorAll('[data-toggles]').forEach(function (cb) {
      var target = document.getElementById(cb.getAttribute('data-toggles'));
      var sync = function () {
        if (!target) return;
        target.hidden = !cb.checked;
        target.querySelectorAll('input').forEach(function (i) { i.required = cb.checked; if (!cb.checked) { target.classList.remove('has-error'); i.removeAttribute('aria-invalid'); } });
      };
      cb.addEventListener('change', sync);
      sync();
    });

    function normalizeUrl() {
      if (site && site.value.trim() && !/^https?:\/\//i.test(site.value.trim())) site.value = 'https://' + site.value.trim();
    }
    function validate(input) {
      var f = input.closest('.field');
      if (!f || f.hidden) return true;
      var ok = input.checkValidity();
      if (ok && input.name === 'competitors' && input.value.trim().length < 3) ok = false;
      f.classList.toggle('has-error', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      var err = f.querySelector('.err');
      var hint = f.querySelector('.hint');
      var ids = [];
      if (ok && hint) ids.push(hint.id);
      if (!ok && err) ids.push(err.id);
      if (ids.length) input.setAttribute('aria-describedby', ids.join(' '));
      return ok;
    }
    if (site) site.addEventListener('blur', function () { normalizeUrl(); if (site.value) validate(site); });
    form.querySelectorAll('.field input, .field select').forEach(function (inp) {
      inp.addEventListener('blur', function () { if (inp.value) validate(inp); });
      inp.addEventListener('input', function () { var f = inp.closest('.field'); if (f && f.classList.contains('has-error')) validate(inp); });
      inp.addEventListener('change', function () { var f = inp.closest('.field'); if (f && f.classList.contains('has-error')) validate(inp); });
    });

    var started = false;
    form.addEventListener('focusin', function () { if (!started) { started = true; track('form_start'); } });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errorBox) errorBox.hidden = true;
      normalizeUrl();
      var firstBad = null;
      form.querySelectorAll('.field input, .field select').forEach(function (inp) { if (!validate(inp) && !firstBad) firstBad = inp; });
      if (firstBad) { firstBad.focus(); track('form_invalid', { field: firstBad.name }); return; }
      var hp = form.querySelector('input[name="company_url_hp"]');
      if (hp && hp.value) return;

      var payload = {};
      new FormData(form).forEach(function (v, k) { if (k !== 'company_url_hp') payload[k] = v; });
      UTM_KEYS.forEach(function (k) { if (pageParams.get(k)) payload[k] = pageParams.get(k); });
      payload.page = window.location.href;
      payload.submitted_at = new Date().toISOString();

      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }

      var success = function () {
        track('lead_submit', { budget: payload.budget || '', timeline: payload.timeline || '', role: payload.role || '', snapshot: payload.snapshot === 'yes' });
        var name = payload.name || '';
        var first = form.querySelector('[data-first-name]');
        if (first) first.textContent = name.trim().split(/\s+/)[0] || 'there';
        var bookLink = form.querySelector('[data-book-prefill]');
        if (bookLink) {
          var extra = { name: name, email: payload.email || '', a1: payload.category || '' };
          bookLink.setAttribute('href', bookingUrl(extra));
          bookLink.addEventListener('click', function (ev) {
            if (ev.metaKey || ev.ctrlKey) return;
            ev.preventDefault();
            openBooking(extra, 'form-success');
          });
        }
        form.classList.add('is-sent');
        var box = form.querySelector('.form__success');
        if (box) { box.setAttribute('tabindex', '-1'); box.focus({ preventScroll: true }); box.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' }); }
      };
      var failure = function () {
        if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); }
        if (errorBox) errorBox.hidden = false;
        track('lead_submit_error');
      };

      if (CONFIG.formEndpoint) {
        fetch(CONFIG.formEndpoint, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
          .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); success(); })
          .catch(failure);
      } else {
        // No endpoint configured: hand the lead to the visitor's email client so nothing is lost.
        var to = CONFIG.email || 'contact@pave.agency';
        var body = Object.keys(payload).map(function (k) { return k + ': ' + payload[k]; }).join('\n');
        var subject = 'Visibility Snapshot request · ' + (payload.company || payload.name || '');
        window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        success();
      }
    });
  }

  /* ---------- year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
