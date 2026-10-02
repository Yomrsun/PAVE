# Editing the PAVE website with Claude Code

This folder is the whole site: the homepage, the "How it works together" deck, every image, font and film, and the strategy docs. You edit it by asking Claude Code in plain English, then preview it in your browser.

## 1. One-time setup (about 10 minutes)

1. **Install Claude Code.** Either:
   - get the Claude desktop app (claude.ai/download) and open the **Code** tab, or
   - in Terminal (Mac) or PowerShell (Windows) run `npm install -g @anthropic-ai/claude-code`. This needs Node.js 18+ from nodejs.org.
2. **Sign in** with your Claude account (Pro, Max, Team or Enterprise) the first time it opens.
3. **Unzip `pave-website.zip`** somewhere easy, such as your Desktop. You'll get a `pave-website` folder.
4. **Open that folder in Claude Code.**
   - In the desktop app, choose `pave-website` as the project folder.
   - In a terminal, run `cd ~/Desktop/pave-website` and then `claude`.
5. **Start a git history** so every change can be undone. Ask Claude:
   > Set up git in this folder and commit everything as "Starting point".

Claude reads `CLAUDE.md` automatically. That file explains how the site is built and the brand rules, so you don't need to explain them yourself.

## 2. See the site

Ask Claude:
> Start a local preview of the site and give me the link.

Then open **http://localhost:8080** for the homepage and **http://localhost:8080/deck/** for the deck. Refresh the page after each change.

## 3. Make changes

Describe what you want the way you'd brief a designer. For example:

- "Change the hero headline to 'Own the answer.' and keep the two-tone style."
- "In the FAQ, rewrite the pricing answer to say engagements start at $15K/month plus media."
- "Swap the photo in the Creative slide of the deck for this file: ~/Downloads/new-shoot.jpg."
- "Add a case study card: B2B SaaS, +38% demo requests in 90 days."
- "Make the services section tighter on mobile."
- "Show me a screenshot of the homepage at phone width."

Good habits:
- **One change at a time**, then check it in the browser.
- **Save checkpoints.** Ask "commit this as 'new hero copy'" when you like where things are. "Undo the last change" or "go back to the 'Starting point' commit" restores earlier work.
- **Keep numbers real.** Every stat should come from the capabilities deck or a real client result. Claude will flag a number it can't trace.

## 4. Export the deck to PDF

Open http://localhost:8080/deck/ in Chrome and click **Export to PDF** (top right). Set Margins to None and turn on Background graphics.

## 5. Put it live

The site is static files, so any host works. The easiest is to drag the `pave-website` folder onto **app.netlify.com/drop**. Before it goes live on pave.agency, read **README.md** for the Calendly, form and analytics setup. You can also ask Claude:
> Walk me through the go-live checklist in README.md.

## Where things are

| You want to change | File |
|---|---|
| Homepage copy, sections, FAQ | `index.html` |
| Colors, fonts, spacing | `assets/css/styles.css` |
| Buttons, forms, the booking calendar | `assets/js/main.js` (Calendly link in `PAVE_CONFIG` at the bottom of `index.html`) |
| The deck | `deck/index.html` |
| Photos and films | `assets/img/photo/`, `assets/video/` |
| Why the page is built this way | `docs/STRATEGY.md` |
