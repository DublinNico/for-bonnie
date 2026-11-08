# TC-BB-EP-002 — "In the mosaic" wording in the photo view

| Field | Value |
|---|---|
| **Test ID** | TC-BB-EP-002 |
| **Technique** | Black-box — equivalence partitioning |
| **Component** | Photo view (`Lightbox.tsx`) |
| **Objective** | The photo view describes how often a photo is used correctly for each kind of usage count, and only offers "Show in mosaic" when there is something to show |
| **Executed** | 2026-11-08, real site (production build, `localhost:3400`) in Playwright Chromium, 1280 × 720 — raw output: [`../results/manual-test-cases.txt`](../results/manual-test-cases.txt) |
| **Related automated tests** | FT-034, FT-035 (sample data) |

## Partitions

| # | Partition (uses) | Expected wording | Expected "Show in mosaic" |
|---|---|---|---|
| P1 | 0 — never used | "Not used" | absent |
| P2 | exactly 1 | "Once" | present |
| P3 | more than 1 | "N times" | present |

Photos for each partition were picked from the **real** `mosaic.json`.

## Cases

| Case | Input | Expected | Result |
|---|---|---|---|
| P1 | Photo 305 (0 uses), opened from the gallery | "Not used", no button | "Not used", button absent — **Pass** |
| P2 | a photo with exactly 1 use | "Once", button | **Not executed — no photo in the real data is used exactly once.** This partition is covered by automated test FT-034 on sample data (passes). |
| P3 | Photo 001 (16 uses), opened from the gallery | "16 times", button | "16 times", button present — **Pass** |

**Overall: Pass (2/2 executable partitions)**; P2 not executable on real data, covered by FT-034.
