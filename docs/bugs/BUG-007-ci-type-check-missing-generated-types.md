# BUG-007 — CI type check failed on a clean machine (`LayoutProps`)

| Field | Value |
|---|---|
| **ID** | BUG-007 |
| **Status** | Fixed |
| **Severity** | Medium (CI only — the site itself was unaffected) |
| **Found by** | The first CI run (GitHub Actions run 42386687966, PR #4) |
| **Found on** | 2026-11-07 |
| **Component** | `.github/workflows/ci.yml` |
| **Fixed in** | `5cfdb00` |

## Summary

The TypeScript check passed locally but failed in CI.

## Steps to reproduce

1. On a fresh clone (no `site/.next/` folder): `cd site && npm ci && npx tsc --noEmit`

## Expected

The type check passes, as it does locally.

## Actual

```
X Type-check (TypeScript)
X Cannot find name 'LayoutProps'.
```

## Cause

`LayoutProps` (used in `app/layout.tsx`) is not written in the project — Next.js **generates** it into `.next/` during `next dev`, `next build` or `next typegen`. Locally `.next/` already existed; a fresh CI machine has none, so the type didn't exist when `tsc` ran. A "works on my machine" bug.

## Fix

`5cfdb00` — CI runs `npx next typegen` before `tsc --noEmit` (documented in `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`).

## Test that now covers it

The CI **frontend** job's "Generate Next.js route types" and "Type check (TypeScript)" steps, which run on a clean machine for every pull request.
