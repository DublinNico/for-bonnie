# TC-BB-BVA-002 — Repeat cooldown distance

| Field | Value |
|---|---|
| **Test ID** | TC-BB-BVA-002 |
| **Technique** | Black-box — boundary value analysis |
| **Component** | Mosaic matching (`bonnie.py`, `tile_score`) |
| **Objective** | A photo is penalised only when it was last used **fewer than** 8 cells away (straight-line distance), so the same photo doesn't clump |
| **Executed** | 2026-11-08 — the real `tile_score()` (Python 3.12.10); raw output: [`../results/manual-test-cases.txt`](../results/manual-test-cases.txt) |
| **Related automated tests** | UT-008, UT-009, UT-010, UT-015, UT-019 |

## Boundary

`COOLDOWN_DISTANCE = 8` cells, `COOLDOWN_PENALTY = 5000`. All cases: same colour (distance 0), never used before (`times_used = 0`), last used at (0, 0).

## Cases

| Case | Input: now at (row, col) | Distance | Expected score | Result |
|---|---|---|---|---|
| Just below | (0, 7) | 7 | 5000 (penalised) | 5000, cooldown applied — **Pass** |
| At limit | (0, 8) | 8 | 0 (not penalised) | 0, no cooldown — **Pass** |
| Just above | (0, 9) | 9 | 0 | 0, no cooldown — **Pass** |
| Diagonal, just below | (5, 6) | 7.81 | 5000 | 5000, cooldown applied — **Pass** |
| Diagonal, just above | (6, 6) | 8.49 | 0 | 0, no cooldown — **Pass** |

**Overall: Pass (5/5)**
