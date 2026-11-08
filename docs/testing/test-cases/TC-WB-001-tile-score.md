# TC-WB-001 — `bonnie.tile_score`

| Field | Value |
|---|---|
| **Test ID** | TC-WB-001 |
| **Technique** | White-box — branch coverage |
| **Component** | `bonnie.py` — scores how well a photo suits a mosaic cell |
| **Objective** | Execute every branch: never used, used nearby, used far away |
| **Executed** | 2026-11-08 — the real function (Python 3.12.10); raw output: [`../results/manual-test-cases.txt`](../results/manual-test-cases.txt) |

## Code under test

```python
def tile_score(cell_color, tile_color, times_used, last_position, row, col):
    score = color_distance(cell_color, tile_color)
    score += times_used * REPEAT_PENALTY
    if last_position is not None:                       # decision D1
        last_row, last_col = last_position
        cells_away = ((row - last_row) ** 2 + (col - last_col) ** 2) ** 0.5
        if cells_away < COOLDOWN_DISTANCE:              # decision D2
            score += COOLDOWN_PENALTY
    return score
```

## Branches

| Branch | Path |
|---|---|
| B1 | D1 false — the photo has never been used |
| B2 | D1 true, D2 true — used before, fewer than 8 cells away |
| B3 | D1 true, D2 false — used before, 8 or more cells away |

## Test cases (one per branch)

Common input: cell red `(255,0,0)`, tile `(250,0,0)` → colour distance 25; `REPEAT_PENALTY = 80`, `COOLDOWN_PENALTY = 5000`.

| Branch | Input (`times_used`, `last_position`, now at) | Expected | Result |
|---|---|---|---|
| B1 | 0, `None`, (0, 0) | 25 | 25 — **Pass** |
| B2 | 1, (0, 0), (0, 1) | 25 + 80 + 5000 = 5105 | 5105 — **Pass** |
| B3 | 1, (0, 0), (0, 20) | 25 + 80 = 105 | 105 — **Pass** |

## Coverage achieved

- Manual cases: **3 / 3 branches**.
- Automated suite (pytest-cov, [`../results/python-function-coverage.txt`](../results/python-function-coverage.txt)): **9 / 9 statements, 4 / 4 branch paths (100%)** — UT-006 – UT-010.
