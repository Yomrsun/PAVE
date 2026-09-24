# pave.agency: conversion homepage

A rebuilt homepage for PAVE with one job: **book qualified 30-minute Category Review calls**, where a
senior lead walks the 2026 capabilities deck against the prospect's own category.

It's static HTML, CSS and JS with no framework and no build step. It can ship as it is or be rebuilt
section by section in Webflow.

```
index.html                 the page (all copy lives here)
assets/css/styles.css      design system and components
assets/js/main.js          interactions: Calendly embed and popup, services list, results filter, form
assets/img/logos/          35 credential logos (monochrome, from deck P.04)
assets/img/work/           Stro, Game Changers Ventures and PTM Wealth imagery (from deck P.35–39)
assets/img/brand/          PAVE mark, wordmark, favicon, touch icon, social share image
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

The page embeds `https://calendly.com/pavemarketingcalendar/30min` in the `#book` section. The
embed loads only when a visitor gets near that section or clicks a booking button. On the event
itself:

- Rename it **"PAVE Category Review · 30 min"**.
- Set a **minimum scheduling notice of 2 business days**, so the Visibility Snapshot can be built
  before the call.
- Add four **required** invitee questions, in this order. Answers to the first are pre-filled from
  the form (`a1`).
  1. The category you intend to own (one sentence)
  2. Two competitors you keep losing to
  3. Your website
  4. Monthly marketing budget: Under $25K · $25K–$100K · $100K–$500K · $500K+
- Set the location to Zoom or Google Meet. The page says "video call".

UTM parameters on the landing URL are passed through to Calendly automatically, so booked calls can
be attributed to campaigns.

### 2. The form

The Snapshot form (`#snapshot`) posts JSON to `formEndpoint`. Point it at Formspree, a HubSpot form
endpoint, or a Zapier/Make webhook that creates the CRM record. Until it's set, the form falls back
to opening a pre-filled email to contact@pave.agency.

### 3. Config

Everything environment-specific lives in one block at the bottom of `index.html`:

```html
<script>
  window.PAVE_CONFIG = {
    calendlyUrl: "https://calendly.com/pavemarketingcalendar/30min",
    calendlyInline: true,   // false = no embed; #book shows a button that opens Calendly in a popup
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
| `form_start` / `form_invalid` / `lead_submit` | The Snapshot form (lead_submit includes budget, timeline and role) |
| `service_open`, `results_filter`, `faq_open` | Engagement signals: what visitors care about |

## Deploy

Any static host works: Netlify, Vercel, Cloudflare Pages, S3/CloudFront or GitHub Pages. Point it at
the repo root.

**Staying on Webflow?** Rebuild the page section by section. The class names map to Webflow classes,
`styles.css` can go in a site-wide embed, and `main.js` in the before-`</body>` embed. If you use a
native Webflow form, keep the same field `name`s so the success step still pre-fills Calendly.

## Editing content

The copy lives directly in `index.html`. The services list, case studies and FAQ are long, repeated
blocks, so they're marked `<!-- gen:services -->`, `<!-- gen:cases -->` and `<!-- gen:faq -->`. You
can edit those by hand like any other HTML. The FAQ is mirrored in the FAQPage JSON-LD in `<head>`,
so update both when you change an answer.
