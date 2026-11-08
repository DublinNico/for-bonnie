# TC-WB-005 — `rename_tiles`

| Field | Value |
|---|---|
| **Test ID** | TC-WB-005 |
| **Technique** | White-box — branch coverage |
| **Component** | `rename_tiles.py` — renames photos to `tile_001`, `tile_002`, … |
| **Objective** | Execute every branch of the two-pass rename (after the BUG-002 fix), including the case that used to lose a photo |
| **Executed** | 2026-11-08 — the real function (Python 3.12.10) on throwaway folders; raw output: [`../results/manual-test-cases.txt`](../results/manual-test-cases.txt) |

## Code under test

```python
def rename_tiles(folder):
    folder = Path(folder)
    files = [item for item in folder.iterdir() if item.is_file()]   # decision F (filter)

    run_id = uuid.uuid4().hex
    temporary = []
    for i, item in enumerate(files, 1):                                # loop 1
        temp_path = folder / f".renaming-{run_id}-{i}{item.suffix}"
        item.rename(temp_path)
        temporary.append(temp_path)

    renamed = []
    for i, temp_path in enumerate(temporary, 1):                       # loop 2
        new_path = folder / f"tile_{i:03d}{temp_path.suffix}"
        temp_path.rename(new_path)
        renamed.append(new_path)
    return renamed
```

## Branches

| Branch | Path |
|---|---|
| R1 | F true — a file is renamed (both loops run) |
| R2 | F false — a sub-folder is skipped |
| R3 | a file already named `tile_001.jpg` (the BUG-002 case): nothing is overwritten |
| R4 | empty folder — both loops run zero times |

## Test cases (one per branch)

| Branch | Input folder | Expected | Result |
|---|---|---|---|
| R1 + R2 + R3 | `beach.jpg`, `tile_001.jpg`, `park.png`, folder `backup/` | 3 files renamed, folder untouched, every photo's contents survive | names `backup, tile_001.jpg, tile_002.png, tile_003.jpg`; contents `beach.jpg, park.png, tile_001.jpg` all present; returned `tile_001.jpg, tile_002.png, tile_003.jpg` — **Pass** |
| R4 | empty | `[]` | `[]` — **Pass** |

## Coverage achieved

- Manual cases: **4 / 4 branches**.
- Automated suite (pytest-cov): **15 / 15 statements, 4 / 4 branch paths (100%)** — UT-042 – UT-044, UT-047.
