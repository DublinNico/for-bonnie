# TC-BB-EP-003 — Gallery sort orders

| Field | Value |
|---|---|
| **Test ID** | TC-BB-EP-003 |
| **Technique** | Black-box — equivalence partitioning |
| **Component** | Gallery (`Gallery.tsx`) |
| **Objective** | Each sort option shows all photos in the right order, and photos with the same usage count are ordered by number |
| **Executed** | 2026-11-08, real site (production build, `localhost:3400`) in Playwright Chromium — expected orders computed from the real `mosaic.json`; raw output: [`../results/manual-test-cases.txt`](../results/manual-test-cases.txt) |
| **Related automated tests** | FT-026 – FT-029, ET-010 |

## Partitions

| # | Partition | Expected |
|---|---|---|
| P1 | "In order" | photo number ascending |
| P2 | "Most used" | usage descending, ties by number |
| P3 | "Least used" | usage ascending, ties by number |
| P4 | Photos with equal usage (ties) | ordered by photo number within the tie |

## Cases

| Case | Input | Expected | Result |
|---|---|---|---|
| P1 | click "In order" | 325 photos, 001 … 325 | 325 photos; first 3: Photo 001, 002, 003; last: Photo 325; matches expected order: true — **Pass** |
| P2 | click "Most used" | most-used first | first 3: Photo 110, 095, 198 (uses 77, 70, 65); last: Photo 305 (0); matches: true — **Pass** |
| P3 | click "Least used" | least-used first | first 3: Photo 305, 018, 074 (uses 0, 3, 7); last: Photo 110 (77); matches: true — **Pass** |
| P4 | ties in the real data | number order within ties | 34 usage values are shared by 2+ photos; all three orders matched the expected tie-broken order — **Pass** |

**Overall: Pass (4/4)**
