import { describe, expect, it } from "vitest";
import { photoLabel, tileUrl, type Photo } from "./types";

const photo: Photo = { id: "tile_042", number: 42, uses: 7 };

describe("photo helpers", () => {
  it("labels photos with a 3-digit number", () => {
    expect(photoLabel(photo)).toBe("Photo 042");
    expect(photoLabel({ ...photo, number: 253 })).toBe("Photo 253");
  });

  it("builds image URLs for each size", () => {
    expect(tileUrl(photo, "xs")).toBe("/tiles/xs/tile_042.webp");
    expect(tileUrl(photo, "lg")).toBe("/tiles/lg/tile_042.webp");
  });
});
