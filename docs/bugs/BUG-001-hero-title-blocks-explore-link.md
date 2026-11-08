# BUG-001 — Hero title blocked the "Explore the mosaic" link on desktop

| Field | Value |
|---|---|
| **ID** | BUG-001 |
| **Status** | Fixed — live since PR #7 (merged 2026-11-08) |
| **Severity** | High — the main call-to-action on the live site did nothing for desktop visitors |
| **Found by** | ET-005 – ET-009 (end-to-end, Playwright) |
| **Found on** | 2026-11-08 |
| **Component** | `site/app/globals.css` (desktop hero) |
| **Fixed in** | `8355639` |

## Summary

On screens 900 px and wider, clicking **"Explore the mosaic ↓"** on the landing page did nothing. This affected the live site, https://for-bonnie.vercel.app.

## Steps to reproduce

1. Open the site in a desktop browser window at least 900 px wide.
2. Click "Explore the mosaic ↓" in the bottom-right of the hero.

## Expected

The page scrolls to the mosaic explorer.

## Actual

Nothing happens. Playwright reported, for every journey starting with that click:

```
locator.click: Test timeout of 30000ms exceeded.
  - <h1 id="top" class="hero-title">…</h1> intercepts pointer events
```

On the live site, the element at the centre of the link was `H1.hero-title`, not the link (`linkIsClickable: false`).

## Cause

The desktop hero layout positions the big "Bon | nie" title as an invisible full-size layer over the whole hero:

```css
.hero-title { position: absolute; inset: 0; z-index: 1; … }
```

It sat on top of the call-to-action, so every click landed on the heading instead of the link. Manual checks never caught it because the explorer had always been reached by scrolling or by URL, never by clicking the link.

## Fix

The title is text only, so it now lets clicks pass through (`8355639`):

```css
pointer-events: none; /* it covers the whole hero: let clicks reach the links underneath */
```

Verified on the live site after deploy (2026-11-08): the element under the link is `A.link-arrow`, and clicking it scrolls to `#mosaic`.

## Test that now covers it

**ET-005, ET-006, ET-007, ET-008, ET-009** — all start by clicking the link (`openMosaic()` in `site/e2e/journeys.spec.ts`), on desktop and phone. They failed before the fix and pass after it.
