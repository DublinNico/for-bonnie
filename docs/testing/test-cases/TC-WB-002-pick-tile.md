# TC-WB-002 — `bonnie.pick_tile`

| Field | Value |
|---|---|
| **Test ID** | TC-WB-002 |
| **Technique** | White-box — branch coverage |
| **Component** | `bonnie.py` — chooses the best photo for a cell |
| **Objective** | Execute every path through the loop: no tiles, the first tile, a better tile, a tie, a worse tile |
| **Executed** | 2026-11-08 — the real function (Python 3.12.10); raw output: [`../results/manual-test-cases.txt`](../results/manual-test-cases.txt) |

## Code under test

```python
def pick_tile(cell_color, tile_colors, usage, last_positions, row, col):
    best_tile = None
    best_score = None
    for tile, tile_color in tile_colors.items():                       # loop L
        score = tile_score(cell_color, tile_color, usage.get(tile, 0), last_positions.get(tile), row, col)
        if best_score is None or score < best_score:                  # decision D
            best_score = score
            best_tile = tile
    return best_tile
```

## Branches

| Branch | Path |
|---|---|
| P1 | L runs zero times (no tiles) |
| P2 | D true via `best_score is None` (first tile) |
| P3 | D true via `score < best_score` (a later tile is better) |
| P4 | D false — equal score (tie keeps the earlier tile) |
| P5 | D false — worse score |

## Test cases (one per branch)

Cell colour red `(255,0,0)`; no usage history.

| Branch | Input `tile_colors` | Expected | Result |
|---|---|---|---|
| P1 | `{}` | `None` | `None` — **Pass** |
| P2 | `{"only": blue}` | `only` | `only` — **Pass** |
| P3 | `{"blue": blue, "red": red}` | `red` | `red` — **Pass** |
| P4 | `{"first": red, "second": red}` | `first` | `first` — **Pass** |
| P5 | `{"red": red, "blue": blue}` | `red` | `red` — **Pass** |

## Coverage achieved

- Manual cases: **5 / 5 paths**.
- Automated suite (pytest-cov): **9 / 9 statements, 4 / 4 branch paths (100%)** — UT-011 – UT-016.
