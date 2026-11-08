# BUG-005 — Next.js 16.3.1 had critical security advisories

| Field | Value |
|---|---|
| **ID** | BUG-005 |
| **Status** | Fixed |
| **Severity** | Critical advisories; low real exposure for this site (see Cause) |
| **Found by** | `npm audit`, run while installing the test tools |
| **Found on** | 2026-11-07 |
| **Component** | `site/package.json` dependencies |
| **Fixed in** | `7bb26d8` |

## Summary

The site's Next.js version (16.3.1) was affected by published critical advisories, including remote code execution.

## Steps to reproduce

1. On a commit before `7bb26d8`, in `site/`: `npm audit`.

## Expected

No critical or high advisories.

## Actual

```
13 vulnerabilities (8 moderate, 4 high, 1 critical)
next (critical) range 16.0.0 - 16.4.0 | fix: next 16.4.5
  - critical Next.js: Unauthenticated Remote Code Execution on windows-hosted servers (GHSA-p293-qw3h-jr36)
  - critical Next.js: Remote Code Execution in next/og ImageResponse (GHSA-vcvr-r3jv-pc5j)
  - ...
```

Also high advisories in `sharp`, `zod`, `js-yaml` and `brace-expansion` (pulled in by build and lint tools).

## Cause

Known vulnerabilities in Next.js 16.0.0 – 16.4.0 and in transitive dependencies. Real exposure was low: the site is static, served by Vercel (not a Windows server), and uses none of the affected features (image optimisation, `next/og`, server actions, `use cache`).

## Fix

`7bb26d8` — `next` and `eslint-config-next` 16.3.1 → 16.4.5 (pinned), plus non-breaking `npm audit fix`. Result: **13 → 8 advisories, all moderate**, all in `minimatch` inside the lint toolchain (npm's only offered fix downgrades to Next.js 15, so they were left — see TestingReport §6.2).

## Test that now covers it

- CI **frontend** job: `npm audit --audit-level=high` (fails on any high/critical advisory).
- CI **backend** job: `npm audit --omit=dev --audit-level=high` (production dependencies) and `pip-audit`.
- Dependabot opens weekly update PRs, with `next` and `eslint-config-next` grouped; a CI check fails if their versions differ.
