# PAVE website: notes for Claude Code

Static site with no build step and no framework: plain HTML, CSS and JS. Edit the files directly.

## Layout

- `index.html`: the homepage. All copy lives here.
- `deck/index.html`: the 15-slide "How it works together" deck (1280×720 slides, "Export to PDF" via the browser's print dialog).
- `assets/css/styles.css`: the design system (pave.agency Webflow tokens: Raveo, `#f8f7f5` / `#efede6` / `#181e25` / `#f58659`, 8px card radius, 16px nav/footer radius, 32px pill radius).
- `assets/js/main.js`: interactions (Calendly embed, accordions, services image swap, results filters, Snapshot form, "Book a meeting" tab).
- `assets/fonts`, `assets/img`, `assets/video`: Raveo fonts, photography, icons, films.
- `docs/STRATEGY.md`: why each section exists (Hormozi / Gary Vee / Chris Do lenses) and the A/B test backlog.
- `docs/CALL-PLAYBOOK.md`: how the 30-minute Category Review call runs.
- `README.md`: Calendly, form, analytics and deploy setup.

## Preview

```bash
python3 -m http.server 8080
# homepage: http://localhost:8080   deck: http://localhost:8080/deck/
```

## Rules when editing

- Keep the look on the pave.agency system above. No generic template styling: no mono labels, numbered eyebrows, cream backgrounds or decorative grid lines.
- One primary CTA label everywhere: "Book a Category Review". Every in-page booking button links to `#book-cal`.
- The FAQ is duplicated in the FAQPage JSON-LD in `<head>`. Change both together.
- Repeated blocks (pain points, services, case studies, FAQ) are marked with `<!-- gen:... -->` comments. They are ordinary HTML, so edit them by hand.
- Each service's hover image and stat come from its `data-stat` / `data-stat-label` attributes plus the matching `data-svc` image in `.svc-media`.
- Whenever AI assistants are listed, name all of them: ChatGPT, Claude, Gemini, Perplexity and Copilot.
- Every number must trace to the capabilities deck or a named case. Don't invent stats.
- Environment settings (Calendly URL, form endpoint, contact email) live in `window.PAVE_CONFIG` at the bottom of `index.html`.
- Check changes at desktop (1440px) and phone (390px) widths. The page must not scroll sideways on a phone.
