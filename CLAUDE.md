# CLAUDE.md

Guidance for AI assistants (and humans) working in this repository.

## What this is

**CazoLabAI** marketing website — a small, static, multi-page site for an
"Enterprise Laboratory Intelligence Platform." It is **plain HTML with inline
CSS and inline JavaScript**. There is no build step, no framework, no package
manager, and no dependencies to install. Files are served exactly as they sit
in the repo.

- **Hosting:** Vercel, using the `@vercel/static` builder (see `vercel.json`).
- **Production domain:** `https://cazolabai.com` (referenced in canonical/OG tags).
- **Contact of record:** `elie@cazolabai.com`, (954) 899-4984, Tamarac, FL 33321.

## Repository layout

```
.
├── index-3.html        # Home page content (hero, features, contact form)
├── dashboard/
│   └── index.html      # Dashboard page → served at /dashboard
├── pricing/
│   └── index.html      # Pricing page (Essential/Professional/Enterprise/Plus) → served at /pricing
├── dashboard-2.html    # Duplicate of dashboard/index.html (see "Known issues")
├── pricing-2.html      # Duplicate of pricing/index.html (see "Known issues")
├── cazolabai-logo.png  # Logo used in the nav of every page
├── vercel.json         # Vercel static build config
└── README.md           # One-line project description
```

Routing is **directory-based**: `pricing/index.html` resolves to the clean URL
`/pricing`, and `dashboard/index.html` resolves to `/dashboard`. The site's nav
links (`/`, `/pricing`, `/dashboard`, `#features`, `#contact`) rely on this.

## Page conventions (follow these when editing or adding pages)

Every page is **self-contained**: the full document, all CSS (inside a single
`<style>` block in `<head>`), and any JavaScript (a single `<script>` before
`</body>`) live in one `.html` file. There are **no shared/external CSS or JS
files** — keep it that way unless deliberately introducing a build pipeline.

Shared patterns across pages, keep them consistent:

- **`<head>` SEO block:** title, `meta description`, `meta keywords`, full
  Open Graph (`og:*`) and Twitter card tags, `<link rel="canonical">`, and a
  favicon link. New pages should include the same set.
- **Header/nav:** logo (`cazolabai-logo.png` + "CazoLabAI" text) on the left,
  nav links on the right, plus a `.mobile-menu` hamburger button shown under
  768px.
- **Design tokens (used inline, no variables):**
  - Primary blue `#2563eb`, hover `#1d4ed8`
  - Accent green (CTAs/links) `#10b981`, hover `#059669`
  - Hero gradient `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
  - Dark sections `#1e293b` / `#0f172a`, body text `#333`, muted `#64748b`
  - Page background `#f8fafc`
  - Container: `max-width: 1200px; margin: 0 auto; padding: 0 20px`
  - System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', …`)
- **Responsive:** a single `@media (max-width: 768px)` breakpoint that stacks
  grids to one column, hides `.nav-links`, and shows `.mobile-menu`.
- **Contact form (home page):** pure client-side — on submit it builds a
  `mailto:elie@cazolabai.com` link from the form fields. No backend, no fetch,
  no form-handling service. If a real backend is ever needed, that is a
  deliberate architectural change worth flagging.

## Development workflow

- **No build / no install.** Edit the `.html` files directly.
- **Local preview:** open the file in a browser, or run a static server from
  the repo root, e.g. `python3 -m http.server 8000` then visit
  `http://localhost:8000/`. (Note the home-page caveat below.)
- **Deploy:** push to the connected branch; Vercel builds with `@vercel/static`
  and serves everything as-is. No CI tests, linters, or type checks exist.

### Git / branch conventions

- Active development branch for assistant work: **`claude/claude-md-docs-7b4fbs`**.
  Develop, commit, and push there; do not push to `main` without explicit
  permission.
- Push with `git push -u origin <branch-name>`.
- Do **not** open a pull request unless the user explicitly asks.

## Known issues / gotchas (verify before "fixing" — these may be intentional)

1. **No root `index.html`.** The home page markup lives in `index-3.html`, but
   nothing maps it to `/`. On Vercel and on a plain static server, visiting `/`
   will not serve the home page. If the home page should be the site root,
   either rename `index-3.html` to `index.html` or add a route/redirect in
   `vercel.json`. Confirm intent with the user before renaming.
2. **Duplicate files.** `dashboard-2.html` is byte-identical to
   `dashboard/index.html`, and `pricing-2.html` is byte-identical to
   `pricing/index.html`. The `-2` copies are not referenced by any nav link and
   appear to be leftovers. When you change a page, update the canonical copy
   under the directory (`dashboard/`, `pricing/`); decide with the user whether
   the duplicates should be deleted rather than kept in sync.
3. **Inline everything.** Because CSS/JS are inlined per page, a shared style or
   script change must be applied to **each** page file individually.

## When making changes

- Keep edits within the existing single-file, inline-CSS/JS structure unless the
  user explicitly wants a build system introduced.
- Reuse the existing design tokens and section patterns above so pages stay
  visually consistent.
- Preserve the full SEO/OG/Twitter/canonical `<head>` block on every page.
- After editing a shared element (nav, footer, colors), check whether the same
  change is needed in the other page files and in the `-2` duplicates.
