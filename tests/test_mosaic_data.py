"""Smoke test: the data the website depends on is complete and consistent.

Catches the "changed the photos but forgot to re-run a script" mistake:
bonnie.py writes site/public/mosaic.json, and make_web_assets.py writes the
web images it points to. If they drift apart, squares on the site go blank.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "site" / "public"


def load_mosaic():
    with open(PUBLIC / "mosaic.json") as f:
        return json.load(f)


def test_UT_045_real_layout_has_one_entry_per_cell():
    mosaic = load_mosaic()
    assert len(mosaic["grid"]) == mosaic["cols"] * mosaic["rows"]


def test_UT_046_every_photo_in_the_real_layout_has_all_three_web_sizes():
    mosaic = load_mosaic()
    missing = [
        f"{size}/{Path(name).stem}.webp"
        for name in set(mosaic["grid"])
        for size in ("xs", "sm", "lg")
        if not (PUBLIC / "tiles" / size / f"{Path(name).stem}.webp").exists()
    ]
    assert missing == [], f"Run make_web_assets.py — missing web images: {missing[:10]}"
