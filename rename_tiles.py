from pathlib import Path


folder = Path("square_images")

for i, item in enumerate(folder.iterdir(), 1):
    new_name = f"tile_{i:03d}{item.suffix}"
    new_path = folder / new_name
    item.rename(new_path)

