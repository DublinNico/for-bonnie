# Progress — Bonnie Photomosaic

_Last updated: 2026-11-07_

## Status
The website is built and deployed: **https://for-bonnie.vercel.app**. The work
sits in a stack of open pull requests that still need merging into `main`
(see below). Remaining tasks are in `TODO.md`.

## Environment
- **Python:** `venv/` on Python 3.12 with Pillow 13.0.0. Rebuilt on
  2026-11-07 — the old venv pointed at a Microsoft Store Python that had been
  removed.
- **Node:** 24 (Next.js 16 needs ≥ 20.9). The site uses Next.js 16.3.1,
  React 19 and Tailwind 4.
- **This PC is ARM64 Windows.** `site/node_modules` was first installed for
  x64, so the ARM64 builds of `lightningcss`, `@tailwindcss/oxide` and
  `@next/swc` were added with `--no-save`. If `npm run dev` fails with
  "Cannot find module ... win32-arm64 ...", delete `site/node_modules` and
  `site/package-lock.json` and run `npm install` again.
- **Vercel CLI** 65 installed globally and logged in (`dublinnico`, team
  `nicoletti-dev`). `site/.vercel/` and `site/.env.local` (holds a Vercel
  token — secret) are git-ignored.

## Photos
- `square_images/` — 325 square tile photos, `tile_001.jpg` … (renamed by
  `rename_tiles.py`; not in git, 185 MB).
- `target_photo/target_bonnie.jpg` — the portrait the mosaic recreates.

## Mosaic (`bonnie.py`)
- 65 × 115 grid = 7,475 cells; 324 of the 325 photos get used (most-used 77×,
  least-used 3×).
- 180 px output tiles, `REPEAT_PENALTY = 80`, spatial cooldown of 8 cells.
- Outputs `mosaic_output.jpg` (~53 MB, git-ignored) and
  `site/public/mosaic.json` (layout for the website). Runs in ~10 seconds.

## Website (`site/`)
- Static Next.js site — hero, canvas mosaic explorer, "how it was made",
  gallery, photo view, dedication. Desktop + mobile.
- Images come from `make_web_assets.py` (`site/public/`, 37 MB) and
  `make_favicon.py` (`site/app/`).
- Design mockups in `docs/mockups/` (desktop) and `docs/mockups/mobile/`.

## Pull requests (stacked — merge in order)
| PR | Branch | What |
|----|--------|------|
| #1 | `tune-mosaic-settings` | 180 px tiles, repeat penalty 80 |
| #2 | `export-mosaic-json` | `bonnie.py` exports `mosaic.json` |
| #3 | `build-website` | the website, web images, CodeRabbit config |
| #4 | `add-ci` | GitHub Actions CI |
| #5 | `add-favicon` | favicon |
| — | `update-docs` | these doc updates |

Each PR targets the branch of the one before it; merging #1 makes GitHub
retarget #2 to `main`, and so on.

## Checks and deployment
- **CI** (GitHub Actions): ESLint, `next typegen` + `tsc`, `next build` on
  every PR and on pushes to `main`.
- **Vercel** project `nicoletti-dev/for-bonnie` (root `site`, Node 24):
  preview per PR, production on merge to `main`.
  - Note: the first deployment went to production from the `add-ci` branch,
    so the public site is live before the PRs are merged. Content is identical.
- **CodeRabbit** reviews code; `.coderabbit.yaml` skips images and generated
  files (the free plan's limit is 100 files per PR).

## Teaching format
See `TEACHING.md` for the full curriculum/rules. Key recalibration during
this build: for libraries the student has never touched (e.g. `pathlib`),
give a complete small worked example up front rather than a list of
methods to assemble from scratch, and explain code in plain conversational
language rather than glossary-style definitions.

When building with Claude, the student wants to watch the work happen: each
file opened in VS Code before it's changed, a plain-language explanation of
the change, then the diff — and to be asked before anything is pushed.
