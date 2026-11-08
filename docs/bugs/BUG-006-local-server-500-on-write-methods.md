# BUG-006 — Local server answers 500 (not 405) to write methods on files

| Field | Value |
|---|---|
| **ID** | BUG-006 |
| **Status** | **Open — accepted** (local only) |
| **Severity** | Low |
| **Found by** | Probing before writing the integration tests; recorded as IT-015 |
| **Found on** | 2026-11-07 |
| **Component** | `next start` (Next.js's own server) — not the site's code |
| **Fixed in** | — |

## Summary

When the site runs locally with `next start`, sending `PUT`, `DELETE`, `POST` or `OPTIONS` to a static file such as `/mosaic.json` gives `500 Internal Server Error` instead of `405 Method Not Allowed`. The request is still refused and nothing changes.

## Steps to reproduce

1. `npm run build && npx next start -p 3200`
2. `curl -X PUT -i http://localhost:3200/mosaic.json`

## Expected

`405 Method Not Allowed`.

## Actual

```
PUT     /mosaic.json -> 500 text/plain   body: "Internal Server Error"
DELETE  /mosaic.json -> 500
POST    /mosaic.json -> 500
OPTIONS /mosaic.json -> 500
```

The body reveals nothing internal, the server logs nothing, and `mosaic.json` is byte-identical afterwards. Re-confirmed 2026-11-08 in TC-BB-EP-001 (P8).

On the **live** site (Vercel's CDN) the same requests are handled correctly:

```
PUT /mosaic.json -> 405   DELETE -> 405   POST -> 405   OPTIONS -> 204
```

## Cause

How `next start` handles non-GET requests for files in `public/`. Production traffic never reaches it: Vercel serves those files from its CDN.

## Fix

None — accepted. Visitors are unaffected, and nothing can be changed or leaked. It could be fixed by adding a `proxy.ts` that answers 405 itself; not worth it for a server that isn't used in production.

## Test that now covers it

- **IT-015** — asserts a clean 405 locally; marked `it.fails` (known issue), so it will flag when Next.js changes this behaviour.
- **IT-013**, **ST-004**, **ST-007** — the request is refused, reveals nothing, and changes nothing.
