import { describe, expect, it } from "vitest";
import { photoLabel, tileUrl, type Photo } from "./types";

const photo: Photo = { id: "tile_042", number: 42, uses: 7 };

describe("photo helpers", () => {
  it("FT-001 labels photos with a 3-digit number", () => {
    expect(photoLabel(photo)).toBe("Photo 042");
    expect(photoLabel({ ...photo, number: 253 })).toBe("Photo 253");
  });

  it("FT-002 builds image URLs for each size", () => {
    expect(tileUrl(photo, "xs")).toBe("/tiles/xs/tile_042.webp");
    expect(tileUrl(photo, "lg")).toBe("/tiles/lg/tile_042.webp");
  });
});
