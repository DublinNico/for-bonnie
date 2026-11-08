// @vitest-environment happy-dom
// "Stored XSS" for this site: the only data that reaches the page is photo names from
// mosaic.json / the tile folder. Hostile names must be refused or rendered as plain text.
import { cleanup, render } from "@testing-library/react";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import Gallery from "../../app/components/Gallery";
import Lightbox from "../../app/components/Lightbox";
import { loadMosaic } from "../../app/lib/load-mosaic";
import type { MosaicData, Photo } from "../../app/lib/types";

afterEach(() => cleanup());

const HOSTILE_IDS = ['x" onerror="alert(1)', "<script>alert(1)</script>", "javascript:alert(1)", "<img src=x onerror=alert(1)>"];
const photos: Photo[] = HOSTILE_IDS.map((id, i) => ({ id, number: i + 1, uses: 1 }));

/** Nothing on the page may run script: no <script> tags, no on* handlers, no javascript: URLs. */
function expectNoExecutableContent(root: HTMLElement) {
  expect(root.querySelectorAll("script")).toHaveLength(0);
  for (const el of root.querySelectorAll("*")) {
    for (const attr of el.getAttributeNames()) {
      expect(attr.startsWith("on"), `${el.tagName} has ${attr}`).toBe(false);
      const value = el.getAttribute(attr) ?? "";
      if (attr === "href" || attr === "src") expect(value.trim().toLowerCase().startsWith("javascript:")).toBe(false);
    }
  }
}

describe("hostile photo names are shown as text, never run", () => {
  it("ST-013 the gallery renders hostile photo names harmlessly", () => {
    const { container } = render(<Gallery photos={photos} onOpen={vi.fn()} />);
    expectNoExecutableContent(container);
    // The hostile text stays inside attribute values, escaped — not turned into elements
    expect(container.querySelectorAll("img")).toHaveLength(HOSTILE_IDS.length);
  });

  it("ST-014 the photo view renders hostile photo names harmlessly", () => {
    const data: MosaicData = { cols: 2, rows: 2, grid: [0, 1, 2, 3], photos };
    for (let position = 0; position < photos.length; position++) {
      const { container, unmount } = render(
        <Lightbox data={data} order={[0, 1, 2, 3]} position={position} onNavigate={vi.fn()} onClose={vi.fn()} onShowInMosaic={vi.fn()} />,
      );
      expectNoExecutableContent(container);
      unmount();
    }
  });

  it("ST-015 the data loader refuses photo names that don't match a real image file", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bonnie-xss-"));
    try {
      fs.mkdirSync(path.join(dir, "tiles", "sm"), { recursive: true });
      fs.writeFileSync(path.join(dir, "tiles", "sm", "tile_001.webp"), "");
      for (const hostile of ['"><script>alert(1)</script>.jpg', "../../.env.local", "javascript:alert(1)"]) {
        fs.writeFileSync(path.join(dir, "mosaic.json"), JSON.stringify({ cols: 1, rows: 1, grid: [hostile] }));
        expect(() => loadMosaic(dir), hostile).toThrow("has no web image");
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
