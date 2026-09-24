/* PAVE homepage — interactions. No dependencies. */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.remove('no-js');
  var CONFIG = window.PAVE_CONFIG || {};
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- analytics hook (GTM / GA4 / Segment read window.dataLayer) ---------- */
  window.dataLayer = window.dataLayer || [];
  function track(event, props) {
    try { window.dataLayer.push(Object.assign({ event: event }, props || {})); } catch (e) { /* noop */ }
  }

  /* ---------- booking link: carry UTMs + prefill into Calendly ---------- */
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var pageParams = new URLSearchParams(window.location.search);
  function bookingUrl(extra) {
    var base = CONFIG.calendlyUrl || 'https://calendly.com/pavemarketingcalendar/30min';
    var url;
    try { url = new URL(base); } catch (e) { return base; }
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
      s.onload = function () { window.Calendly ? resolve(window.Calendly) : reject(); };
      s.onerror = reject;
      document.head.appendChild(s);
      setTimeout(function () { if (!window.Calendly) reject(); }, 6000);
    });
    return calendlyLoading;
  }

  function openBooking(extra, source) {
    var url = bookingUrl(extra);
    track('book_call_click', { cta_location: source || 'unknown' });
    if (CONFIG.calendlyPopup === false || window.innerWidth < 720) {
      window.open(url, '_blank', 'noopener');
      return;
    }
    loadCalendly().then(function (C) {
      C.initPopupWidget({ url: url });
    }).catch(function () {
      window.open(url, '_blank', 'noopener');
    });
  }

  document.querySelectorAll('[data-book]').forEach(function (el) {
    el.setAttribute('href', bookingUrl());
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener');
    el.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // let "open in new tab" work
      e.preventDefault();
      openBooking(null, el.getAttribute('data-book'));
    });
  });

  // Calendly -> analytics
  window.addEventListener('message', function (e) {
    if (!e.data || typeof e.data.event !== 'string' || e.data.event.indexOf('calendly.') !== 0) return;
    if (e.data.event === 'calendly.event_scheduled') track('call_booked', { source: 'calendly' });
  });

  /* ---------- nav ---------- */
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav__toggle');
  var menu = document.getElementById('mobile-menu');
  function setMenu(open) {
    if (!nav) return;
    nav.classList.toggle('is-open', open);
    if (toggle) toggle.setAttribute('aria-expanded', String(open));
    if (menu) menu.toggleAttribute('inert', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (toggle) toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
  if (menu) {
    menu.setAttribute('inert', '');
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  var hero = document.querySelector('.hero');
  var sticky = document.querySelector('.sticky-cta');
  var finalSection = document.getElementById('book');
  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle('is-scrolled', y > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // sticky mobile CTA: visible after the hero, hidden while the booking section is on screen
  if (sticky && 'IntersectionObserver' in window) {
    var heroGone = false, finalOn = false;
    var upd = function () { sticky.classList.toggle('is-on', heroGone && !finalOn); };
    if (hero) new IntersectionObserver(function (en) { heroGone = !en[0].isIntersecting; upd(); }, { threshold: 0 }).observe(hero);
    if (finalSection) new IntersectionObserver(function (en) { finalOn = en[0].isIntersecting; upd(); }, { threshold: 0.1 }).observe(finalSection);
  }

  /* ---------- load + reveal ---------- */
  requestAnimationFrame(function () { doc.classList.add('is-loaded'); });

  var revealEls = document.querySelectorAll('.reveal, [data-observe]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- count-up numbers ---------- */
  function formatNum(n, decimals) {
    return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  var counters = document.querySelectorAll('[data-count]');
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = (el.getAttribute('data-count').split('.')[1] || '').length;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1400, t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + formatNum(target * eased, decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && !reduceMotion) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        runCounter(en.target);
        cio.unobserve(en.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- bar charts (indexed to baseline = 100) ---------- */
  var charts = document.querySelectorAll('.bars');
  function fillBars(chart) {
    var before = parseFloat(chart.getAttribute('data-before') || '100');
    var after = parseFloat(chart.getAttribute('data-after') || '100');
    var max = Math.max(before, after);
    var b = chart.querySelector('.bar--before i');
    var a = chart.querySelector('.bar--after i');
    if (b) b.style.height = (before / max * 100) + '%';
    if (a) a.style.height = (after / max * 100) + '%';
  }
  if ('IntersectionObserver' in window && !reduceMotion) {
    var bio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        fillBars(en.target);
        bio.unobserve(en.target);
      });
    }, { threshold: 0.4 });
    charts.forEach(function (c) { bio.observe(c); });
  } else {
    charts.forEach(fillBars);
  }

  /* ---------- marquee: clone group for a seamless loop ---------- */
  document.querySelectorAll('.marquee__track').forEach(function (track) {
    var group = track.querySelector('.marquee__group');
    if (!group) return;
    var clone = group.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('a, button').forEach(function (n) { n.setAttribute('tabindex', '-1'); });
    clone.querySelectorAll('img').forEach(function (n) { n.alt = ''; });
    track.appendChild(clone);
  });

  /* ---------- services list: accordion + cursor-follow image ---------- */
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

  var cursor = document.querySelector('.svc-cursor');
  var cursorImg = cursor ? cursor.querySelector('img') : null;
  var list = document.querySelector('.svc-list');
  if (cursor && cursorImg && list && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion) {
    var mx = 0, my = 0, cx = 0, cy = 0, raf = null;
    var loop = function () {
      cx += (mx - cx) * 0.18; cy += (my - cy) * 0.18;
      cursor.style.transform = 'translate3d(' + (cx + 24) + 'px,' + (cy - 90) + 'px,0) scale(' + (cursor.classList.contains('is-on') ? 1 : 0.9) + ')';
      raf = requestAnimationFrame(loop);
    };
    list.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; if (!raf) { cx = mx; cy = my; loop(); } });
    list.addEventListener('mouseleave', function () { cursor.classList.remove('is-on'); cancelAnimationFrame(raf); raf = null; });
    svcs.forEach(function (svc) {
      var src = svc.getAttribute('data-img');
      if (src) { var pre = new Image(); pre.src = src; }
      svc.addEventListener('mouseenter', function () {
        if (!src) { cursor.classList.remove('is-on'); return; }
        if (cursorImg.getAttribute('src') !== src) cursorImg.setAttribute('src', src);
        cursor.classList.add('is-on');
      });
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
        var match = f === 'all' || (c.getAttribute('data-tags') || '').split(' ').indexOf(f) > -1;
        c.hidden = !match;
        if (match) {
          shown++;
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
      if (d.open) track('faq_open', { question: (d.querySelector('summary') || {}).textContent.trim().slice(0, 80) });
    });
  });

  /* ---------- lead form ---------- */
  var form = document.getElementById('lead-form');
  if (form) {
    var tabs = form.querySelectorAll('[role="tab"]');
    var intentInput = form.querySelector('input[name="intent"]');
    var submitLabel = form.querySelector('[data-submit-label]');
    var intros = form.querySelectorAll('[data-intent-copy]');
    function setIntent(intent) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-intent') === intent;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      if (intentInput) intentInput.value = intent;
      intros.forEach(function (p) { p.hidden = p.getAttribute('data-intent-copy') !== intent; });
      if (submitLabel) submitLabel.textContent = submitLabel.getAttribute('data-' + intent) || submitLabel.textContent;
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { setIntent(t.getAttribute('data-intent')); });
      t.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        next.focus(); next.click();
      });
    });
    document.querySelectorAll('[data-intent-link]').forEach(function (a) {
      a.addEventListener('click', function () { setIntent(a.getAttribute('data-intent-link')); });
    });

    function fieldOf(input) { return input.closest('.field'); }
    function validate(input) {
      var f = fieldOf(input);
      if (!f) return true;
      var ok = input.checkValidity();
      if (ok && input.type === 'url' && input.value && !/^https?:\/\//i.test(input.value)) ok = false;
      f.classList.toggle('has-error', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      return ok;
    }
    // accept "acme.com" in the website field
    var site = form.querySelector('input[name="website"]');
    if (site) site.addEventListener('blur', function () {
      if (site.value && !/^https?:\/\//i.test(site.value)) site.value = 'https://' + site.value.trim();
      validate(site);
    });
    form.querySelectorAll('input, select, textarea').forEach(function (inp) {
      inp.addEventListener('blur', function () { if (inp.value) validate(inp); });
      inp.addEventListener('input', function () { if (fieldOf(inp) && fieldOf(inp).classList.contains('has-error')) validate(inp); });
    });

    var started = false;
    form.addEventListener('focusin', function () { if (!started) { started = true; track('form_start'); } });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (site && site.value && !/^https?:\/\//i.test(site.value)) site.value = 'https://' + site.value.trim();
      var inputs = form.querySelectorAll('input[required], select[required], textarea[required], input[type="email"], input[type="url"]');
      var firstBad = null;
      inputs.forEach(function (inp) { if (!validate(inp) && !firstBad) firstBad = inp; });
      if (firstBad) { firstBad.focus(); return; }
      if (form.querySelector('.hp input') && form.querySelector('.hp input').value) return; // bot

      var data = new FormData(form);
      UTM_KEYS.forEach(function (k) { if (pageParams.get(k)) data.append(k, pageParams.get(k)); });
      data.append('page', window.location.href);
      var payload = {};
      data.forEach(function (v, k) { payload[k] = payload[k] ? payload[k] + ', ' + v : v; });

      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }

      var done = function () {
        track('lead_submit', { intent: payload.intent || 'call', budget: payload.budget || '' });
        var name = payload.name || '';
        var email = payload.email || '';
        var bookLink = form.querySelector('[data-book-prefill]');
        if (bookLink) {
          var url = bookingUrl({ name: name, email: email, a1: payload.category || '' });
          bookLink.setAttribute('href', url);
          bookLink.addEventListener('click', function (ev) {
            if (ev.metaKey || ev.ctrlKey) return;
            ev.preventDefault();
            openBooking({ name: name, email: email, a1: payload.category || '' }, 'form-success');
          });
        }
        var first = form.querySelector('[data-first-name]');
        if (first) first.textContent = name.split(' ')[0] || 'there';
        form.classList.add('is-sent');
        var success = form.querySelector('.form__success');
        if (success) { success.setAttribute('tabindex', '-1'); success.focus(); }
      };

      var endpoint = CONFIG.formEndpoint;
      if (endpoint) {
        fetch(endpoint, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
          .then(function (r) { if (!r.ok) throw new Error('bad status'); done(); })
          .catch(function () { mailtoFallback(payload); done(); });
      } else {
        mailtoFallback(payload);
        done();
      }
    });

    function mailtoFallback(p) {
      var to = CONFIG.email || 'contact@pave.agency';
      var lines = Object.keys(p).filter(function (k) { return k !== 'company_url_hp'; }).map(function (k) { return k + ': ' + p[k]; });
      var subject = (p.intent === 'snapshot' ? 'Visibility Snapshot request' : 'Walkthrough request') + ' — ' + (p.company || p.name || '');
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
    }

    var params = new URLSearchParams(window.location.search);
    if (params.get('intent')) setIntent(params.get('intent'));
  }

  /* ---------- year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
