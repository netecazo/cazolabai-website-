# CLAUDE.md

Guidance for AI assistants (and humans) working in this repository.

## What this is

The marketing/website for **CazoLabAI**, an "Enterprise Laboratory Intelligence
Platform." It is a small **static website** — hand-written HTML with inline CSS
and vanilla JavaScript. There is **no build step, no framework, no package
manager, and no dependencies**. Files are served as-is.

Deployment is via **Vercel** as a static site (`vercel.json` uses
`@vercel/static` to build `**/*`). Pushing to the repo's connected branch
triggers a Vercel deploy; the production domain is `cazolabai.com`.

## Repository layout

```
.
├── index-3.html        # Homepage (hero, features, contact form)
├── dashboard/
│   └── index.html      # /dashboard — login/access-request page (in development)
├── pricing/
│   └── index.html      # /pricing — four-tier pricing page
├── dashboard-2.html    # DUPLICATE of dashboard/index.html (orphan, root level)
├── pricing-2.html      # DUPLICATE of pricing/index.html (orphan, root level)
├── cazolabai-logo.png  # Logo, referenced as /cazolabai-logo.png (or ../ from subdirs)
├── vercel.json         # Static build config
└── README.md           # One-line description
```

### Page routing
Clean URLs come from the directory structure: `/dashboard` and `/pricing`
resolve to their `index.html` files. Internal navigation links point to `/`,
`/pricing`, and `/dashboard`.

> **Known quirk — the homepage filename.** There is **no root `index.html`**.
> The homepage content lives in `index-3.html`. Nav links and CTAs point to
> `/`, which on a static host normally maps to `/index.html`. If the homepage
> ever fails to load at the domain root, this is why. When making homepage
> changes, edit `index-3.html`, and be aware the canonical fix is to rename/copy
> it to `index.html` (confirm with the maintainer before doing so, since the
> current deploy may rely on a Vercel-side mapping).

### Duplicate files
`dashboard-2.html` and `pricing-2.html` at the repo root are **byte-identical
copies** of `dashboard/index.html` and `pricing/index.html`. They are not
linked from anywhere. If you change a page, the directory version
(`dashboard/index.html`, `pricing/index.html`) is the live one. Avoid editing
only the `-2` copies. Consider proposing their removal if asked to clean up.

## Conventions

These pages were authored by hand and share consistent conventions. Match them
when editing or adding pages.

- **Single-file pages.** Each HTML page is fully self-contained: all CSS lives
  in one `<style>` block in the `<head>`, all JS in one `<script>` block before
  `</body>`. There are **no shared/external CSS or JS files** — styles are
  duplicated across pages by design. If you restyle one page, check whether the
  others need the same change for visual consistency.
- **No external dependencies / CDNs.** No Tailwind, Bootstrap, jQuery, fonts,
  or analytics. Keep it dependency-free unless explicitly asked otherwise.
- **CSS reset + system font.** Every page starts with
  `* { margin:0; padding:0; box-sizing:border-box; }` and uses the
  `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...` system font
  stack.
- **Layout.** A `.container` wrapper (`max-width: 1200px; margin: 0 auto;
  padding: 0 20px`) centers content. Sections use `padding: 4rem 0`.
- **Responsive.** Each page has a `@media (max-width: 768px)` block. Preserve
  mobile behavior (stacked grids, hidden nav, etc.) when editing.

### Brand / design tokens
Reuse these exact values for visual consistency (they are hard-coded, not
variables):

| Token              | Value                                            |
|--------------------|--------------------------------------------------|
| Primary blue       | `#2563eb` (hover/dark `#1d4ed8`)                  |
| Accent green (CTA) | `#10b981` (hover `#059669`)                      |
| Hero gradient      | `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` |
| Dark sections      | `#1e293b` / footer `#0f172a`                      |
| Body text          | `#333`; muted text `#64748b` / `#6b7280`         |
| Page background    | `#f8fafc`                                         |
| Border radius      | `8px` (inputs/buttons), `12px`–`16px` (cards)    |

### Forms (no backend)
There is **no server**. All forms are handled client-side in JavaScript and
work by opening the user's email client via `mailto:` links to
**`elie@cazolabai.com`**:
- Homepage contact form (`#contactForm`) builds a `mailto:` body and redirects.
- Dashboard "login"/demo/access flows all funnel to `mailto:` requests (the
  dashboard is explicitly marked *in development*).

When editing forms, keep the `mailto:` pattern unless asked to integrate a real
backend, and keep the contact email in sync across pages.

### SEO / metadata
Pages include `<title>`, `<meta name="description">`, Open Graph (`og:*`), and
Twitter card tags, plus a `<link rel="canonical">`. When adding or substantially
editing a page, update these tags to match its content.

## Development workflow

- **Run locally:** open the HTML file directly in a browser, or serve the repo
  root with any static server, e.g. `python3 -m http.server 8000` then visit
  `http://localhost:8000/index-3.html`, `/dashboard/`, `/pricing/`.
- **No build, no tests, no linters.** There is nothing to compile or install.
  Verify changes by eye in a browser at desktop and mobile widths.
- **Editing checklist:**
  1. Edit the live file (directory `index.html` for subpages, `index-3.html`
     for the homepage).
  2. Keep shared styles/nav/footer/contact-email consistent across pages.
  3. Check the `@media (max-width: 768px)` block still looks right.
  4. Update SEO meta tags if content changed.

## Git & deployment

- Work on the feature branch you were assigned; do not push to `main` without
  explicit permission.
- Use clear, descriptive commit messages.
- Pushing to the Vercel-connected branch deploys the static site. There is no
  CI to wait on for this repo.
- Do **not** open a pull request unless explicitly asked.
