"""One-off: rename every photo in square_images/ to tile_001.jpg, tile_002.jpg, ...

    python rename_tiles.py

Already done for this project. Running it again could renumber the photos and
break the mosaic layout, so only run it on a fresh folder of photos.
"""

import uuid
from pathlib import Path


def rename_tiles(folder):
    """Rename every file in `folder` to tile_001, tile_002, ... keeping its extension.

    Safe even if some files already have tile_### names: everything is first moved
    to a unique temporary name, so a new name can never land on an existing photo.
    Returns the new paths, in the order the files were numbered.
    """
    folder = Path(folder)
    files = [item for item in folder.iterdir() if item.is_file()]  # snapshot before renaming anything

    # Pass 1: move every file out of the way, to a name nothing else can have
    run_id = uuid.uuid4().hex
    temporary = []
    for i, item in enumerate(files, 1):
        temp_path = folder / f".renaming-{run_id}-{i}{item.suffix}"
        item.rename(temp_path)
        temporary.append(temp_path)

    # Pass 2: the old names are all free now, so the final names can't collide
    renamed = []
    for i, temp_path in enumerate(temporary, 1):
        new_path = folder / f"tile_{i:03d}{temp_path.suffix}"
        temp_path.rename(new_path)
        renamed.append(new_path)
    return renamed


# Only rename when run as a script, never when a test imports this file
if __name__ == "__main__":
    rename_tiles("square_images")
