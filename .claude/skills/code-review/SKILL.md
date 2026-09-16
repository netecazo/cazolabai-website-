---
name: code-review
description: >
  Reviews a diff, PR, branch, or file for correctness bugs and for
  reuse/simplification/efficiency cleanups. Use whenever the user asks to
  review code, review a PR, review this diff/branch/change, or check code
  for bugs before merging. Not for style-only nitpicks on unrelated code or
  for writing new features.
license: MIT
---

# Code Review

Review only what changed (the diff, PR, or branch named), not the whole
codebase. Read enough surrounding context to judge each change correctly —
callers, call sites, related tests — but don't wander into unrelated files.

## What to look for

1. **Correctness bugs** — logic errors, off-by-one, wrong operator, unhandled
   edge case, broken null/undefined handling, race conditions, incorrect
   assumptions about input shape or ordering.
2. **Security** — injection (SQL, command, XSS), missing auth/authorization
   checks, secrets in code, unsafe deserialization, path traversal.
3. **Reuse & simplification** — duplicated logic that already exists
   elsewhere in the codebase, unnecessary abstraction, dead code.
4. **Efficiency** — obviously wasteful loops, N+1 queries, unbounded
   allocations, avoidable re-renders or re-computation.
5. **Test coverage** — a changed code path with no test covering the new
   behavior or the bug being fixed.

## How to report

For each finding: file and line, a one-sentence summary of the defect, and
a concrete failure scenario (input/state → wrong output/crash). Rank
findings most-severe first. Skip anything you can't back with a concrete
failure scenario — no vague style preferences, no "consider" hedges without
a reason.

If nothing survives scrutiny, say so plainly instead of inventing
low-value nits to fill space.
