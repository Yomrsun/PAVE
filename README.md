# pave.agency — conversion homepage

A rebuilt homepage for PAVE designed to do one job: **book qualified 30-minute calls where we walk
prospects through the 2026 capabilities deck against their own category.**

Static HTML/CSS/JS with no framework and no build step, so it can go live as it is or be rebuilt
section by section in Webflow.

```
index.html                 the page (all copy lives here)
assets/css/styles.css      design system + components
assets/js/main.js          interactions: Calendly popup, services list, results filter, form
assets/img/logos/          35 credential logos (monochrome, from the deck)
assets/img/work/           Stro · Game Changers Ventures · PTM Wealth imagery (from the deck)
assets/img/brand/          PAVE mark, wordmark, favicon, social share image
docs/COPY.md               final copy deck, section by section
docs/STRATEGY.md           the Hormozi / Gary Vee / Chris Do reasoning behind every section
docs/CALL-PLAYBOOK.md      run-of-show for the deck walkthrough call the page sets up
docs/LAUNCH-CHECKLIST.md   claims and offer mechanics PAVE must confirm before going live
```

## Preview locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Configure

Everything that changes per environment lives in one block near the bottom of `index.html`:

```html
<script>
  window.PAVE_CONFIG = {
    calendlyUrl: "https://calendly.com/pavemarketingcalendar/30min",
    calendlyPopup: true,          // false = always open Calendly in a new tab
    formEndpoint: "",             // POST JSON here (Formspree, HubSpot, Make/Zapier webhook, Webflow Logic…)
    email: "contact@pave.agency"
  };
</script>
```

- **Booking.** Every element with `data-book` becomes a Calendly link. UTM parameters on the landing
  URL are passed through to Calendly so booked calls can be attributed to campaigns. On desktop,
  Calendly opens as an in-page popup (loaded only on first click). On mobile, or if the script is
  blocked, it opens in a new tab.
- **Form.** It posts JSON to `formEndpoint`. If `formEndpoint` is empty, it falls back to opening a
  pre-filled email to `contact@pave.agency`, so set a real endpoint before launch. After a
  submission, the form shows a "pick your time now" step with the visitor's name, email and
  category pre-filled into Calendly.
- **Analytics.** Events are pushed to `window.dataLayer` (GTM/GA4 compatible): `book_call_click`
  (with `cta_location`), `call_booked` (from Calendly's postMessage), `form_start`, `lead_submit`,
  `service_open`, `results_filter`, `faq_open`.

## Deploy

Any static host works: Netlify, Vercel, Cloudflare Pages, S3/CloudFront or GitHub Pages. Just point
it at the repo root.

**Staying on Webflow?** Rebuild the page from this repo section by section. The classes map 1:1
to Webflow classes, and `styles.css` can go in a site-wide embed while each section is rebuilt
natively. The Webflow form can replace `#lead-form`: keep the same field names so the success step
still works.

## Before launch

Work through `docs/LAUNCH-CHECKLIST.md`. The page makes offer commitments (the pre-call deliverable,
the response window, the guarantee) and names brands and case studies from a deck marked
*Confidential*. Each of those needs a yes from PAVE before this goes live.
