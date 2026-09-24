/* pave.agency homepage — interactions. No dependencies. */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.remove('no-js');
  var CONFIG = window.PAVE_CONFIG || {};
  var CALENDLY = CONFIG.calendlyUrl || 'https://calendly.com/pavemarketingcalendar/30min';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- analytics (GTM / GA4 read window.dataLayer) ---------- */
  window.dataLayer = window.dataLayer || [];
  function track(event, props) {
    try { window.dataLayer.push(Object.assign({ event: event }, props || {})); } catch (e) { /* noop */ }
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-cta]');
    if (el) track('cta_click', { cta_location: el.getAttribute('data-cta'), cta_text: el.textContent.trim().slice(0, 60) });
  });

  /* ---------- Calendly URL: UTMs + prefill ---------- */
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var params = new URLSearchParams(window.location.search);
  function bookingUrl(extra) {
    var url;
    try { url = new URL(CALENDLY); } catch (e) { return CALENDLY; }
    UTM_KEYS.forEach(function (k) { if (params.get(k)) url.searchParams.set(k, params.get(k)); });
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
      setTimeout(function () { if (!window.Calendly) reject(new Error('timeout')); }, 4000);
    }).catch(function (err) { calendlyLoading = null; throw err; });
    return calendlyLoading;
  }

  function openBooking(extra, source) {
    var url = bookingUrl(extra);
    track('book_call_click', { cta_location: source || 'unknown' });
    if (window.innerWidth < 768) { window.open(url, '_blank', 'noopener'); return; }
    loadCalendly().then(function (C) { C.initPopupWidget({ url: url }); })
      .catch(function () { window.location.href = url; });
  }

  $$('[data-book]').forEach(function (el) {
    el.setAttribute('href', bookingUrl());
    el.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      openBooking(null, el.getAttribute('data-book'));
    });
  });
  $$('[data-book-tab]').forEach(function (el) {
    el.setAttribute('href', bookingUrl());
    el.addEventListener('click', function () { track('book_call_click', { cta_location: 'calendar-new-tab' }); });
  });

  // Inline calendar in #book-cal: loaded once, when it nears the viewport or a booking CTA is clicked.
  var slot = $('[data-calendly]');
  var embedStarted = false, calIO = null;
  function embedCalendar() {
    if (!slot || embedStarted || CONFIG.calendlyInline === false) return;
    embedStarted = true;
    if (calIO) calIO.disconnect();
    loadCalendly().then(function (C) {
      var holder = document.createElement('div');
      holder.className = 'calendly-inline-widget';
      slot.appendChild(holder);
      var u = new URL(bookingUrl());
      u.searchParams.set('hide_gdpr_banner', '1');
      u.searchParams.set('hide_event_type_details', '1');
      u.searchParams.set('hide_landing_page_details', '1');
      u.searchParams.set('background_color', 'ffffff');
      u.searchParams.set('text_color', '181e25');
      u.searchParams.set('primary_color', 'f58659');
      C.initInlineWidget({ url: u.toString(), parentElement: holder });
      setTimeout(function () { slot.classList.add('is-embedded'); }, 7000); // safety net
      track('calendar_embedded');
    }).catch(function () { embedStarted = false; });
  }
  if (slot) {
    if (hasIO) {
      calIO = new IntersectionObserver(function (en) { if (en[0].isIntersecting) embedCalendar(); }, { rootMargin: '900px 0px' });
      calIO.observe(slot);
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href="#book-cal"]');
      if (a) embedCalendar();
    });
  }
  window.addEventListener('message', function (e) {
    if (!e.data || typeof e.data.event !== 'string' || e.data.event.indexOf('calendly.') !== 0) return;
    if (e.data.event === 'calendly.event_type_viewed' && slot) slot.classList.add('is-embedded');
    if (e.data.event === 'calendly.date_and_time_selected') track('call_time_selected');
    if (e.data.event === 'calendly.event_scheduled') track('call_booked', { source: 'calendly' });
  });

  /* ---------- nav ---------- */
  var nav = $('#nav');
  var burger = $('.nav__burger');
  var menu = $('#menu');
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
  }
  if (nav && burger && menu) {
    menu.setAttribute('inert', '');
    burger.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); burger.focus(); } });
  }
  var hero = $('.hero');
  function onScroll() {
    var limit = hero ? hero.offsetHeight - 90 : 40;
    if (nav) nav.classList.toggle('is-solid', window.scrollY > limit);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- floating "Book a meeting" tab ---------- */
  var meeting = $('#meeting');
  if (meeting) {
    var tab = $('.meeting__tab', meeting);
    var panel = $('.meeting__panel', meeting);
    var setMeeting = function (open) {
      meeting.classList.toggle('is-open', open);
      tab.setAttribute('aria-expanded', String(open));
      if (open) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
    };
    setMeeting(false);
    tab.addEventListener('click', function () { setMeeting(!meeting.classList.contains('is-open')); track('meeting_tab_toggle'); });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) setMeeting(false); });
    // step aside while the calendar or the footer form is on screen
    if (hasIO) {
      var away = new Set(['hero']);
      meeting.classList.add('is-away');
      var heroEl = document.querySelector('.hero');
      if (heroEl) new IntersectionObserver(function (en) {
        if (en[0].intersectionRatio >= 0.5) away.add('hero'); else away.delete('hero');
        meeting.classList.toggle('is-away', away.size > 0);
        if (away.size) setMeeting(false);
      }, { threshold: [0, 0.5, 1] }).observe(heroEl);
      ['book', 'contact'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        new IntersectionObserver(function (en) {
          if (en[0].isIntersecting) away.add(id); else away.delete(id);
          meeting.classList.toggle('is-away', away.size > 0);
          if (away.size) setMeeting(false);
        }, { threshold: 0.05 }).observe(el);
      });
    }
  }

  /* ---------- videos: lazy band video, respect reduced motion ---------- */
  $$('video').forEach(function (v) {
    if (reduceMotion) { v.removeAttribute('autoplay'); try { v.pause(); } catch (e) { /* noop */ } }
  });
  var lazyVideos = $$('video[data-lazy-video]');
  if (!reduceMotion && hasIO) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var v = en.target;
        $$('source[data-src]', v).forEach(function (s) { s.src = s.getAttribute('data-src'); s.removeAttribute('data-src'); });
        v.load();
        var p = v.play(); if (p && p.catch) p.catch(function () { /* autoplay blocked */ });
        vio.unobserve(v);
      });
    }, { rootMargin: '400px 0px' });
    lazyVideos.forEach(function (v) { vio.observe(v); });
  }

  /* ---------- reveal ---------- */
  var rv = $$('.rv');
  if (hasIO && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- count-up ---------- */
  function runCounter(el) {
    var raw = el.getAttribute('data-count');
    var target = parseFloat(raw);
    var decimals = (raw.split('.')[1] || '').length;
    var suffix = el.getAttribute('data-suffix') || '';
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / 1400, 1);
      var v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (hasIO && !reduceMotion) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (el) { cio.observe(el); });
  }

  /* ---------- marquees: duplicate for a seamless loop ---------- */
  $$('.marquee__track').forEach(function (track) {
    var group = $('.marquee__group', track);
    if (!group) return;
    var clone = group.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    $$('img', clone).forEach(function (n) { n.alt = ''; });
    track.appendChild(clone);
  });

  /* ---------- diagnosis accordion (one open at a time) ---------- */
  var pains = $$('.pain');
  pains.forEach(function (p) {
    var b = $('button', p);
    b.addEventListener('click', function () {
      var open = !p.classList.contains('is-open');
      pains.forEach(function (o) { o.classList.remove('is-open'); $('button', o).setAttribute('aria-expanded', 'false'); });
      if (open) { p.classList.add('is-open'); b.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ---------- services: hover swaps the image, click opens details ---------- */
  var list = $('.svc-list');
  var svcs = $$('.svc');
  var mediaImgs = $$('.svc-media img');
  var cap = $('.svc-media__cap');
  function showSvc(svc) {
    var id = svc.id;
    mediaImgs.forEach(function (img) { img.classList.toggle('is-on', img.getAttribute('data-svc') === id); });
    if (cap) { $('b', cap).textContent = svc.getAttribute('data-stat'); $('span', cap).textContent = svc.getAttribute('data-stat-label'); }
  }
  if (svcs.length) showSvc(svcs[0]);
  svcs.forEach(function (svc) {
    var b = $('.svc__btn', svc);
    var panel = $('.svc__panel', svc);
    if (panel) panel.setAttribute('inert', '');
    b.addEventListener('mouseenter', function () {
      svcs.forEach(function (o) { o.classList.toggle('is-active', o === svc); });
      showSvc(svc);
    });
    b.addEventListener('focus', function () { showSvc(svc); });
    b.addEventListener('click', function () {
      var open = !svc.classList.contains('is-open');
      svc.classList.toggle('is-open', open);
      b.setAttribute('aria-expanded', String(open));
      if (panel) { if (open) panel.removeAttribute('inert'); else panel.setAttribute('inert', ''); }
      showSvc(svc);
      if (open) track('service_open', { service: $('.svc__name', svc).textContent });
    });
  });
  if (list) {
    list.addEventListener('mouseenter', function () { list.classList.add('is-hovering'); });
    list.addEventListener('mouseleave', function () { list.classList.remove('is-hovering'); svcs.forEach(function (o) { o.classList.remove('is-active'); }); });
  }

  /* ---------- results filter ---------- */
  var filters = $$('[data-filter]');
  var cases = $$('.case[data-tags]');
  var status = $('#results-status');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filters.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      var shown = 0;
      cases.forEach(function (c) {
        var match = f === 'all' || c.getAttribute('data-tags').split(' ').indexOf(f) > -1;
        c.hidden = !match;
        if (match) { shown++; c.classList.add('in'); }
      });
      if (status) status.textContent = 'Showing ' + shown + ' case ' + (shown === 1 ? 'study' : 'studies');
      track('results_filter', { filter: f });
    });
  });

  /* ---------- FAQ analytics ---------- */
  $$('#faq details').forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) track('faq_open', { question: $('summary', d).textContent.trim().slice(0, 80) }); });
  });

  /* ---------- Snapshot form ---------- */
  var form = $('#snapshot');
  if (form) {
    var site = $('input[name="website"]', form);
    var errorBox = $('.form__error', form);

    $$('[data-toggles]', form).forEach(function (cb) {
      var target = document.getElementById(cb.getAttribute('data-toggles'));
      var sync = function () {
        if (!target) return;
        target.hidden = !cb.checked;
        $$('input', target).forEach(function (i) {
          i.required = cb.checked;
          if (!cb.checked) { target.classList.remove('has-error'); i.removeAttribute('aria-invalid'); }
        });
      };
      cb.addEventListener('change', sync);
      sync();
    });

    var normalizeUrl = function () {
      if (site && site.value.trim() && !/^https?:\/\//i.test(site.value.trim())) site.value = 'https://' + site.value.trim();
    };
    var validate = function (input) {
      var f = input.closest('.field');
      if (!f || f.hidden || !input.required) return true;
      var ok = input.checkValidity() && input.value.trim().length > 0;
      f.classList.toggle('has-error', !ok);
      if (ok) input.removeAttribute('aria-invalid'); else input.setAttribute('aria-invalid', 'true');
      return ok;
    };
    if (site) site.addEventListener('blur', function () { normalizeUrl(); if (site.value) validate(site); });
    $$('.field input', form).forEach(function (inp) {
      inp.addEventListener('blur', function () { if (inp.value) validate(inp); });
      inp.addEventListener('input', function () { var f = inp.closest('.field'); if (f && f.classList.contains('has-error')) validate(inp); });
    });
    var started = false;
    form.addEventListener('focusin', function () { if (!started) { started = true; track('form_start'); } });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errorBox) errorBox.hidden = true;
      normalizeUrl();
      var firstBad = null;
      $$('.field input', form).forEach(function (inp) { if (!validate(inp) && !firstBad) firstBad = inp; });
      if (firstBad) { firstBad.focus(); track('form_invalid', { field: firstBad.name }); return; }
      if ($('input[name="company_url_hp"]', form).value) return;

      var payload = {};
      new FormData(form).forEach(function (v, k) { if (k !== 'company_url_hp') payload[k] = v; });
      UTM_KEYS.forEach(function (k) { if (params.get(k)) payload[k] = params.get(k); });
      try { payload.company = new URL(payload.website).hostname.replace(/^www\./, ''); } catch (err) { /* noop */ }
      payload.page = window.location.href;
      payload.submitted_at = new Date().toISOString();
      var wantsSnap = payload.snapshot === 'yes';

      var btn = $('button[type="submit"]', form);
      if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }

      var success = function (viaMail) {
        track(viaMail ? 'lead_mailto_fallback' : 'lead_submit', { budget: payload.budget || '', timeline: payload.timeline || '', role: payload.role || '', snapshot: wantsSnap });
        var first = $('[data-first-name]', form);
        if (first) first.textContent = (payload.name || '').trim().split(/\s+/)[0] || 'there';
        var title = $('[data-success-title]', form);
        var copy = $('[data-success-copy]', form);
        if (viaMail) {
          if (title) title.textContent = 'Almost there';
          if (copy) copy.innerHTML = 'Your email app just opened with your details filled in. Press send and ' + (wantsSnap ? 'your Snapshot will be in your inbox within two business days.' : 'we\'ll reply within two business days.') + ' No email app? Write to <a href="mailto:contact@pave.agency">contact@pave.agency</a>.';
        } else if (!wantsSnap && copy) {
          copy.textContent = 'We\'ll reply within two business days. Want to pick a time for your Category Review now?';
        }
        var bookLink = $('[data-book-prefill]', form);
        if (bookLink) {
          var extra = { name: payload.name || '', email: payload.email || '', a1: payload.category || '', a2: payload.competitors || '', a3: payload.website || '', a4: payload.budget || '' };
          bookLink.setAttribute('href', bookingUrl(extra));
          bookLink.addEventListener('click', function (ev) {
            if (ev.metaKey || ev.ctrlKey) return;
            ev.preventDefault();
            openBooking(extra, 'form-success');
          });
        }
        form.classList.add('is-sent');
        var box = $('.form__success', form);
        if (box) { box.setAttribute('tabindex', '-1'); box.focus({ preventScroll: true }); }
      };
      var failure = function () {
        if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); }
        if (errorBox) errorBox.hidden = false;
        track('lead_submit_error');
      };

      if (CONFIG.formEndpoint) {
        fetch(CONFIG.formEndpoint, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
          .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); success(false); })
          .catch(failure);
      } else {
        // No endpoint configured yet: hand the lead to the visitor's email client.
        var body = Object.keys(payload).map(function (k) { return k + ': ' + payload[k]; }).join('\n');
        var subject = (wantsSnap ? 'Visibility Snapshot request · ' : 'Category Review request · ') + (payload.company || payload.name || '');
        window.location.href = 'mailto:' + (CONFIG.email || 'contact@pave.agency') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        success(true);
      }
    });
  }

  /* ---------- year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
