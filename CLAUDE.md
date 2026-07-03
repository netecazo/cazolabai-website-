# CLAUDE.md

This file provides guidance to Claude Code (claude.com/claude-code) when working with code in this repository.

## Project Overview

CazoLabAI professional marketing website — an Enterprise Laboratory Intelligence Platform site. It is a plain static HTML site with no build system, no package manager, and no framework. All styling is inline `<style>` blocks within each HTML file; there are no external CSS or JavaScript files.

## Structure

- `index-3.html` — main landing page (CazoLabAI homepage)
- `dashboard/index.html` — dashboard page, served at `/dashboard`
- `pricing/index.html` — pricing page, served at `/pricing`
- `dashboard-2.html`, `pricing-2.html` — older/alternate versions of the dashboard and pricing pages
- `cazolabai-logo.png` — site logo asset
- `vercel.json` — Vercel deployment config (`@vercel/static`, serves all files as static assets)

## Development

There is no build, test, or lint step. To preview locally, serve the directory with any static file server, e.g.:

```bash
python3 -m http.server 8000
```

## Deployment

The site deploys to Vercel as a static site (see `vercel.json`). Every file in the repo is served as-is, so any committed HTML page becomes a live route. The production domain is `cazolabai.com`.

## Conventions

- Each page is fully self-contained: keep CSS in the page's own `<style>` block rather than adding external stylesheets.
- Pages share common SEO metadata patterns (title, description, Open Graph, Twitter card tags) — keep these consistent when adding or editing pages.
- Directory-based routes (`dashboard/`, `pricing/`) use `index.html`; numbered root files (`-2`, `-3`) are page revisions.
