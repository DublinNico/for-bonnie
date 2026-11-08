"""Unit tests for rename_tiles.py. Uses throwaway folders — never the real photos."""

from rename_tiles import rename_tiles


def make_files(folder, names):
    for name in names:
        (folder / name).write_text(name)  # each file's contents = its original name


def test_UT_042_every_file_is_renamed_to_a_numbered_tile_keeping_its_extension(tmp_path):
    make_files(tmp_path, ["beach.jpg", "sofa.jpg", "park.png"])

    rename_tiles(tmp_path)

    # Files are numbered in the order the file system lists them (which varies by OS),
    # so check the numbering and that each photo kept its own extension — not the order
    files = sorted(tmp_path.iterdir())
    assert [p.stem for p in files] == ["tile_001", "tile_002", "tile_003"]
    for p in files:
        original_name = p.read_text()
        assert p.suffix == "." + original_name.split(".")[-1]


def test_UT_043_no_photo_is_lost_and_the_new_paths_are_returned(tmp_path):
    make_files(tmp_path, ["a.jpg", "b.jpg"])

    renamed = rename_tiles(tmp_path)

    assert [p.name for p in renamed] == ["tile_001.jpg", "tile_002.jpg"]
    assert sorted(p.read_text() for p in renamed) == ["a.jpg", "b.jpg"]  # both photos still there


def test_UT_044_running_on_a_folder_that_already_has_tile_names_loses_nothing(tmp_path):
    # Used to crash on Windows / overwrite a photo elsewhere: a new name landed on tile_001.jpg
    make_files(tmp_path, ["a_new_photo.jpg", "tile_001.jpg", "tile_002.jpg", "zzz.jpg"])

    rename_tiles(tmp_path)

    assert sorted(p.name for p in tmp_path.iterdir()) == ["tile_001.jpg", "tile_002.jpg", "tile_003.jpg", "tile_004.jpg"]
    contents = sorted(p.read_text() for p in tmp_path.iterdir())
    assert contents == ["a_new_photo.jpg", "tile_001.jpg", "tile_002.jpg", "zzz.jpg"]  # every photo survives


def test_UT_047_folders_inside_are_left_alone(tmp_path):
    make_files(tmp_path, ["a.jpg"])
    (tmp_path / "backup").mkdir()

    rename_tiles(tmp_path)

    assert sorted(p.name for p in tmp_path.iterdir()) == ["backup", "tile_001.jpg"]
