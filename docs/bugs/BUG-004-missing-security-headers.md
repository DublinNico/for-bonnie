# BUG-004 — No security headers; `X-Powered-By` advertised the framework

| Field | Value |
|---|---|
| **ID** | BUG-004 |
| **Status** | Fixed — live since PR #7 |
| **Severity** | Medium |
| **Found by** | IT-021, IT-022 (integration tests, first as expected failures) and a manual check of the live site |
| **Found on** | 2026-11-07 |
| **Component** | `site/next.config.ts` |
| **Fixed in** | `904a6d6` |

## Summary

The site sent none of the standard browser-security headers, and the Next.js server announced itself with `X-Powered-By: Next.js`.

## Steps to reproduce

1. `curl -sI http://localhost:3000/` (local) or `curl -sI https://for-bonnie.vercel.app/` (live).
2. Look for `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `X-Powered-By`.

## Expected

Security headers present on every response; no framework advertising.

## Actual

- Local and live: no `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` or frame-ancestors policy.
- Local: `X-Powered-By: Next.js` (Vercel removes it on the live site).

## Cause

Next.js sends neither by default and advertises itself unless `poweredByHeader` is turned off; `next.config.ts` was still the empty starter file.

## Fix

`904a6d6` — `next.config.ts` sets `poweredByHeader: false` and adds, on every URL: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. Confirmed on the live site after deploy.

## Test that now covers it

- **IT-021** — no `X-Powered-By`.
- **IT-022** — all five headers on the page, the data, an image and the 404 page.

Both were `it.fails` (documented known issues) before the fix and normal passing tests after it.
