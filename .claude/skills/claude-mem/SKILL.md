---
name: claude-mem
description: >
  Reference for claude-mem, a persistent cross-session memory system
  (github.com/thedotmack/claude-mem). NOT functional as a standalone skill
  file: it depends on the claude-mem plugin's hooks, background worker, and
  memory database, none of which are installed in this repository. Use this
  only to point the user at installing the real plugin when they ask about
  cross-session memory, recalling past sessions, or "did we already do X".
license: MIT
---

# Claude-mem (reference only)

This file documents claude-mem; it does not implement it. Unlike a
self-contained prompt skill, claude-mem needs infrastructure this repo does
not have:

- Session hooks that capture transcripts as they happen.
- A background worker that compresses transcripts into "observations".
- A local database (SQLite + embeddings) storing those observations.
- MCP tools (`search`, `timeline`, `get_observations`, `get_tool_uses`) that
  query that database.

None of that exists here, so a bare `SKILL.md` describing its workflow
would produce a skill that always fails to find its tools.

## To actually use claude-mem

Install the real plugin, which wires up the hooks, worker, and MCP server:

```
/plugin marketplace add thedotmack/claude-mem
/plugin install claude-mem@claude-mem
```

Project: [github.com/thedotmack/claude-mem](https://github.com/thedotmack/claude-mem)

## What it gives you once installed

Once installed, ask things like "did we already fix this bug?" or "how did
we solve X last time?" and the plugin's `mem-search` skill searches past
sessions (search → filter → fetch, in that order, to avoid pulling full
transcripts unnecessarily) instead of guessing from the current
conversation alone.
