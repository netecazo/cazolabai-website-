---
name: obsidian-second-brain
description: >
  Reference for obsidian-second-brain, a skill that operates an Obsidian
  vault as a self-rewriting knowledge base
  (github.com/eugeniughelbur/obsidian-second-brain). NOT functional as
  dropped into this repository: it needs an actual Obsidian vault path,
  its setup script, and (for the research commands) API keys for
  Grok/Perplexity/YouTube, none of which exist here. Use this only to
  point the user at installing the real skill when they ask about saving
  notes to Obsidian, vault management, or a "second brain".
license: MIT
---

# Obsidian Second Brain (reference only)

This file documents obsidian-second-brain; it does not implement it. The
real skill operates directly on an Obsidian vault's markdown files and
needs infrastructure this repo does not have:

- A path to an actual Obsidian vault (`--vault /path/to/vault`).
- `scripts/setup.sh` run against that vault to wire a `_CLAUDE.md` manual
  and (optionally) a SessionStart hook that injects vault context.
- Python scripts (`scripts/vault_health.py`, `scripts/bootstrap_vault.py`,
  etc.) that scan, heal, and reindex the vault.
- API keys (`.env`: Grok/X, Perplexity, YouTube) for the research commands
  (`/research`, `/x-read`, `/x-pulse`, `/youtube`, `/podcast`, `/notebooklm`).

None of that applies to a static marketing website repo, so a bare
`SKILL.md` copy would only produce commands that fail for missing vault
paths and missing keys.

## To actually use it

Install the real skill against your own Obsidian vault:

```
bash scripts/setup.sh "/path/to/your/vault"
```

or, once the plugin marketplace is added:

```
/plugin marketplace add eugeniughelbur/obsidian-second-brain
/plugin install obsidian-second-brain@obsidian-second-brain
```

Project: [github.com/eugeniughelbur/obsidian-second-brain](https://github.com/eugeniughelbur/obsidian-second-brain)

## What it gives you once installed

Commands like `/obsidian-save`, `/obsidian-daily`, `/obsidian-capture`,
and `/obsidian-find` let Claude read, write, and reconcile notes in your
vault directly — decisions, people, projects, and research findings get
saved and cross-linked automatically instead of living only in chat.
