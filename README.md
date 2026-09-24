# pave.agency: conversion homepage

A rebuilt homepage for PAVE with one job: **book qualified 30-minute Category Review calls**, where a
senior lead walks the 2026 capabilities deck against the prospect's own category.

It's static HTML, CSS and JS with no framework and no build step. The visual system is the current
pave.agency Webflow system (Raveo, the same colors, radii, pill buttons, pill labels, floating nav, dark accordion
section and "Start Paving." footer card, plus your own photography, the silk hero film and the logo-in-sand film), combined with
layout moves from the Cunnet reference (giant type, photo strip, statement with an inline pill, oversized services
list with image swap, dark portfolio grid, giant wordmark sign-off). It can ship as it is or be rebuilt section by section in Webflow.

```
index.html                 the page (all copy lives here)
assets/css/styles.css      design system: pave.agency Webflow tokens (Raveo, #f8f7f5 / #efede6 / #181e25 / #f58659) + Cunnet layouts
assets/js/main.js          interactions: Calendly embed, services list, results filter, accordions, form, "Book a meeting" tab
assets/fonts/              Raveo 400–700 (from the pave.agency Webflow project)
assets/video/              fabric.mp4 (silk hero film, as on pave.agency) · pave-sand.mp4 (logo-in-sand film for the "20 years" band, 2.2 MB)
assets/img/photo/          pave.agency photography and textures, web-sized
assets/img/logos/          35 credential logos (monochrome, from deck P.04)
assets/img/work/           Stro, Game Changers Ventures and PTM Wealth imagery (from deck P.35–39)
assets/img/icons/          pave.agency feature icons + Zoom mark
assets/img/brand/          logos (white / orange), favicon, touch icon, dots texture, social share image
docs/STRATEGY.md           how the Hormozi, Gary Vee and Chris Do lenses shaped each section, plus an A/B test backlog
docs/CALL-PLAYBOOK.md      minute-by-minute run of the Category Review, mapped to deck pages
```

## Preview

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Set up before going live

### 1. Calendly

The page embeds `https://calendly.com/pavemarketingcalendar/30min` in the `#book-cal` card. Every booking button on the page scrolls straight to it. The
embed loads only when a visitor gets near that section or clicks a booking button. On the event
itself:

- Rename it **"Pave Category Review"** (it's currently "Pave Agency Clarity Call"). The embed hides Calendly's event header, so the page's own card title is what visitors see, but the confirmation email uses the event name.
- Set a **minimum scheduling notice of 2 business days**, so the Visibility Snapshot can be built
  before the call.
- Add four **required** invitee questions, in this order. Answers to the first are pre-filled from
  the form (`a1`–`a4`) when someone books from the form's success screen.
  1. The category you intend to own (one sentence)
  2. Two competitors you keep losing to
  3. Your website
  4. Monthly marketing budget: Under $25K · $25K–$100K · $100K–$500K · $500K+
- Set the location to Zoom or Google Meet. The page says "video call".

UTM parameters on the landing URL are passed through to Calendly automatically, so booked calls can
be attributed to campaigns.

### 2. The form

The Snapshot form (`#snapshot`, in the footer card) posts JSON to `formEndpoint`. Point it at
Formspree or a Zapier/Make webhook that creates the CRM record. Until it's set, the form opens a
pre-filled email to contact@pave.agency and tells the visitor to press send (it doesn't claim the
lead was received), and the event is logged as `lead_mailto_fallback` instead of `lead_submit`.

### 3. Config

Everything environment-specific lives in one block at the bottom of `index.html`:

```html
<script>
  window.PAVE_CONFIG = {
    calendlyUrl: "https://calendly.com/pavemarketingcalendar/30min",
    calendlyInline: true,   // false = no embed; the #book-cal card shows a button that opens Calendly in a popup
    formEndpoint: "",       // POST JSON here
    email: "contact@pave.agency"
  };
</script>
```

### 4. Analytics

Add your GTM or GA4 snippet to `<head>`. The page pushes these events to `window.dataLayer`:

| Event | When |
|---|---|
| `cta_click` | Any CTA, with `cta_location` (hero, nav, offer, rooms, services, case, sticky, …) |
| `calendar_embedded` | The Calendly embed loaded |
| `call_time_selected` / `call_booked` | From Calendly's own events. `call_booked` is the primary conversion |
| `form_start` / `form_invalid` / `lead_submit` / `lead_mailto_fallback` | The Snapshot form (lead_submit includes budget, timeline and role) |
| `meeting_tab_toggle` | The floating "Book a meeting" tab |
| `service_open`, `results_filter`, `faq_open` | Engagement signals: what visitors care about |

## Deploy

Any static host works: Netlify, Vercel, Cloudflare Pages, S3/CloudFront or GitHub Pages. Point it at
the repo root.

**Staying on Webflow?** Rebuild the page section by section. The class names map to Webflow classes,
`styles.css` can go in a site-wide embed, and `main.js` in the before-`</body>` embed. If you use a
native Webflow form, keep the same field `name`s so the success step still pre-fills Calendly.

## Editing content

The copy lives directly in `index.html`. The long repeated blocks (pain points, services, case
studies, FAQ) are marked with `<!-- gen:... -->` comments; edit them by hand like any other HTML. The
FAQ is mirrored in the FAQPage JSON-LD in `<head>`, so update both when you change an answer. Each
service's hover image and stat live in its `data-stat` / `data-stat-label` attributes and the matching
`data-svc` image in `.svc-media`.
