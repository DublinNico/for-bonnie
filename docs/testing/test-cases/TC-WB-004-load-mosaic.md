# TC-WB-004 — `loadMosaic`

| Field | Value |
|---|---|
| **Test ID** | TC-WB-004 |
| **Technique** | White-box — branch coverage |
| **Component** | `site/app/lib/load-mosaic.ts` — reads the mosaic data at build time |
| **Objective** | Execute every branch, including the one the automated suite does not reach |
| **Executed** | 2026-11-08 — the real function (Node 24 running `load-mosaic.ts`) on throwaway folders; raw output: [`../results/manual-test-cases.txt`](../results/manual-test-cases.txt) |

## Code under test (lines 19–42)

```ts
const ids = fs
  .readdirSync(path.join(publicDir, "tiles", "sm"))
  .filter((file) => file.endsWith(".webp"))                          // decision F
  .map((file) => file.replace(/\.webp$/, ""))
  .sort();
// ...
const grid = raw.grid.map((filename) => {
  const id = filename.replace(/\.[^.]+$/, "");
  const index = indexById.get(id);
  if (index === undefined) {                                          // decision U
    throw new Error(`${filename} is in mosaic.json but has no web image. Run make_web_assets.py.`);
  }
  uses[index]++;
  return index;
});

const photos: Photo[] = ids.map((id, i) => ({
  id,
  number: Number(id.match(/\d+/)?.[0] ?? i + 1),                      // decision N (line 40)
  uses: uses[i],
}));
```

## Branches

| Branch | Path |
|---|---|
| L1 | F true and F false — a `.webp` file kept, another file dropped |
| L2 | U false — the name has a web image |
| L3 | U true — the name has no web image: throw |
| L4 | N left — the name contains digits: number taken from it |
| L5 | N right (`?? i + 1`) — the name has **no** digits: numbered by position |

## Test cases (one per branch)

| Branch | Input (grid; files in `tiles/sm`) | Expected | Result |
|---|---|---|---|
| L1 | `tile_001.jpg`; `tile_001.webp, readme.md` | only `tile_001` listed | `grid [0]`, photos `[tile_001]` — **Pass** |
| L2 | `tile_007.jpg`; `tile_007.webp` | loads | `grid [0]`, `tile_007` number 7 — **Pass** |
| L3 | `ghost.jpg`; `tile_001.webp` | throws | `ERROR: ghost.jpg is in mosaic.json but has no web image. Run make_web_assets.py.` — **Pass** |
| L4 | `tile_042.jpg`; `tile_042.webp` | number 42 | number 42 — **Pass** |
| L5 | `beach.jpg, tile_002.jpg`; `beach.webp, tile_002.webp` | `beach` numbered by position (1) | `beach` number 1, `tile_002` number 2 — **Pass** |

## Coverage achieved

- Manual cases: **5 / 5 branches**.
- Automated suite (Vitest + V8): **4 / 5 branch paths (80%)** — the **L5 fallback on line 40 is not covered** by FT-020 – FT-025 ([`../results/unit-coverage-by-file-and-function.txt`](../results/unit-coverage-by-file-and-function.txt): `missing: line 40 (binary-expr, path 2)`). Recorded as an accepted gap with a next step to automate it (TestingReport §6.2, §6.4). In practice all real photo names are `tile_###`, so L5 is never hit by the real data.
