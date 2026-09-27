# design-sync notes: @labready/ui

- This package was created for the design sync. The site itself is static HTML/CSS (no React). The components are thin wrappers that render the site's existing classes; `build.mjs` concatenates `labready/assets/labready.css` + `labready/app/app.css` into `dist/labready.css`, so the synced look always matches the live site. Change styles in those two files, not here.
- Run everything from `labready/design-system/` (the config home). Build: `npm run build` (esbuild ESM + `tsc` for `.d.ts`).
- Converter command: `node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules --entry ./dist/index.js --out ./ds-bundle`.
- Render check: playwright must be importable from `.ds-sync/` (NODE_PATH doesn't reach ESM imports). The container's chromium is revision 1194 → install `playwright@1.56.1` into `.ds-sync` with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`; browsers come from `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`.
- Disabled buttons: the site CSS gained `.btn:disabled { opacity: 0.55 }` (Sept 2026), so Button has a Disabled story again.
- Modal's backdrop is `position: fixed`; its preview wraps it in a `transform: translateZ(0)` box so it stays inside the card (`cardMode: single`).
- Most components render full-width content, so they use `cardMode: column`; contact-sheet thumbnails crop at the right edge, but the full-size review sheets are complete.
- Synced to the Claude Design project "LabReady Pro" (projectId in config.json). First sync: 16 components, 88 files, `_ds_sync.json` anchor uploaded last. Access from claude.ai/code needs Claude Design's "Send to Claude Code Web" first; without it DesignSync returns an authorization error.
- Re-sync: fetch the project's `_ds_sync.json` to `.design-sync/.cache/remote-sync.json`, then `node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules ./node_modules --entry ./dist/index.js --out ./ds-bundle --remote .design-sync/.cache/remote-sync.json`.

## Known render warns
- none

## Re-sync risks
- Any change to `labready/assets/labready.css` or `labready/app/app.css` changes the bundle CSS; rebuild (`npm run build`) before re-syncing or the design system drifts from the site.
- Class names used by the components (`btn`, `card`, `form-card`, `callout`, `pill`, `stat-tile`, `stats`, `field-grid`, `radio-row`, `list`, `doc`, `empty`, `progress`, `view-head`, `tabs`, `logo`, `modal`) are the contract with the site CSS. Renaming one in the site breaks the matching component silently; re-check the contact sheet after CSS edits.
- Previews' sample data (names, dates) is illustrative, copied from the demo lab.
