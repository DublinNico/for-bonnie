// User journeys, start to finish, in a real browser (desktop + 375px phone).
// The site has no forms or logins; these are the journeys a visitor actually takes.
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const zoomLabel = (page: Page) => page.locator(".explorer-zoom output");
const zoomPercent = async (page: Page) => Number.parseInt((await zoomLabel(page).textContent()) ?? "0");
const photoLabel = (id: string) => `Photo ${id.match(/\d+/)![0].padStart(3, "0")}`;

/** How many squares use each photo, read from the live data so tests follow the real mosaic. */
async function usage(page: Page) {
  const mosaic = (await (await page.request.get("/mosaic.json")).json()) as { grid: string[] };
  const counts = new Map<string, number>();
  for (const name of mosaic.grid) {
    const id = name.replace(/\.[^.]+$/, "");
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

async function openMosaic(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: /Explore the mosaic/ }).click();
  // The link smooth-scrolls: wait until the section has arrived at the top of the screen,
  // otherwise positions measured mid-scroll are stale by the time the mouse moves
  // (within 1 px: on high-density phone screens it settles at fractions like -0.39)
  await expect.poll(() => page.locator("#mosaic").evaluate((el) => Math.abs(el.getBoundingClientRect().top))).toBeLessThan(1);
  await expect(zoomLabel(page)).toHaveText("100%");
}

async function zoomIn(page: Page, times: number) {
  for (let i = 0; i < times; i++) await page.getByRole("button", { name: "Zoom in" }).click();
}

test.describe("browsing", () => {
  test("ET-002 the nav links take you to each section", async ({ page }) => {
    await page.goto("/");
    for (const [link, section] of [
      ["Gallery", "#gallery"],
      ["For Bonnie", "#for-bonnie"],
      ["Mosaic", "#mosaic"],
    ]) {
      await page.locator(".nav-links").getByRole("link", { name: link }).click();
      await expect(page.locator(section)).toBeInViewport();
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    }
  });

  test("ET-003 unknown pages show a 404", async ({ page }) => {
    const res = await page.goto("/no-such-page");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("This page could not be found")).toBeVisible();
  });

  test("ET-004 there are no forms or logins to submit", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("form")).toHaveCount(0);
    await expect(page.locator("input:not([type=range])")).toHaveCount(0);
  });
});

test.describe("exploring the mosaic", () => {
  test("ET-005 zooming in loads the real photos and shrinks the mini-map box", async ({ page }) => {
    await openMosaic(page);
    const tilesLoaded = page.waitForResponse((res) => /\/tiles\/(xs|sm)\/tile_\d+\.webp$/.test(res.url()) && res.ok());
    await zoomIn(page, 3);
    await tilesLoaded;
    expect(await zoomPercent(page)).toBeGreaterThan(300);
    const box = await page.locator(".explorer-mini span").getAttribute("style");
    expect(Number.parseFloat(box!.match(/width: ([\d.]+)%/)![1])).toBeLessThan(100);
  });

  test("ET-006 tapping a square shows its photo, and opening it shows that photo full size", async ({ page }) => {
    await openMosaic(page);
    await page.getByRole("img", { name: /Mosaic of Bonnie/ }).click(); // centre of the mosaic
    const name = await page.locator(".explorer-card .t1").textContent();
    expect(name).toMatch(/^Photo \d{3}$/);

    await page.getByRole("button", { name: `Open ${name}` }).click();
    await expect(page.getByRole("dialog", { name: name! })).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("img")).toHaveAttribute("src", /\/tiles\/lg\/tile_\d+\.webp/);
  });

  test("ET-007 Ctrl + scroll zooms the mosaic, not the page", async ({ page, isMobile }) => {
    test.skip(isMobile, "mouse wheel journey");
    await openMosaic(page);
    const box = (await page.getByRole("img", { name: /Mosaic of Bonnie/ }).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, -300);
    await page.keyboard.up("Control");

    await expect.poll(() => zoomPercent(page)).toBeGreaterThan(100);
    expect(await page.evaluate(() => window.visualViewport?.scale ?? 1)).toBe(1); // the page itself didn't zoom
  });

  test("ET-008 plain scrolling over the mosaic scrolls the page and shows the zoom hint", async ({ page, isMobile }) => {
    test.skip(isMobile, "mouse wheel journey");
    await openMosaic(page);
    const box = (await page.getByRole("img", { name: /Mosaic of Bonnie/ }).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 400);

    await expect(page.getByText("Hold Ctrl and scroll to zoom")).toHaveCSS("opacity", "1");
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
    expect(await zoomPercent(page)).toBe(100);
  });

  test("ET-009 dragging moves around the zoomed-in mosaic", async ({ page, isMobile }) => {
    test.skip(isMobile, "mouse drag journey");
    await openMosaic(page);
    await zoomIn(page, 2);
    // At this zoom the tall mosaic still fits across the screen (so it stays centred
    // sideways) but not top to bottom — so drag vertically
    const mini = page.locator(".explorer-mini span");
    const top = async () => (await mini.getAttribute("style"))!.match(/top: ([\d.]+)%/)![1];
    const topBefore = await top();

    const box = (await page.getByRole("img", { name: /Mosaic of Bonnie/ }).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 250, { steps: 10 });
    await page.mouse.up();

    await expect.poll(top).not.toBe(topBefore);
  });
});

test.describe("the gallery and photo view", () => {
  test("ET-010 sort by most used, open, browse with the keyboard, close with Esc", async ({ page }) => {
    const ranked = [...(await usage(page)).entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    await page.goto("/#gallery");
    const gallery = page.locator("#gallery");
    await gallery.getByRole("button", { name: "Most used" }).click();

    const first = gallery.getByRole("img", { name: photoLabel(ranked[0][0]) });
    await first.click();
    const viewer = page.getByRole("dialog");
    await expect(viewer).toHaveAccessibleName(photoLabel(ranked[0][0]));
    await expect(viewer.getByText(`${ranked[0][1]} times`)).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await expect(viewer).toHaveAccessibleName(photoLabel(ranked[1][0]));

    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
    await expect(page.locator(":focus")).toHaveClass(/gallery-item/); // focus went back to the gallery
  });

  test("ET-011 'Show in mosaic' highlights every place the photo is used, then Clear removes it", async ({ page }) => {
    const counts = await usage(page);
    await page.goto("/#gallery");
    await page.locator("#gallery").getByRole("img", { name: "Photo 001" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Show in mosaic" }).click();

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.locator("#mosaic")).toBeInViewport();
    const banner = page.locator(".explorer-focus");
    await expect(banner).toHaveText(new RegExp(`Photo 001 · ${counts.get("tile_001")} places`));

    await banner.getByRole("button", { name: "Clear" }).click();
    await expect(banner).toBeHidden();
  });

  test("ET-012 downloading a photo saves the full-size image", async ({ page }) => {
    await page.goto("/#gallery");
    await page.locator("#gallery").getByRole("img", { name: "Photo 002" }).click();
    const download = page.waitForEvent("download");
    await page.getByRole("dialog").getByRole("link", { name: "Download" }).click();
    const file = await download;

    expect(file.suggestedFilename()).toBe("bonnie-tile_002.webp");
    const path = await file.path();
    const bytes = (await import("node:fs")).readFileSync(path);
    expect(bytes.subarray(0, 4).toString()).toBe("RIFF"); // a real WebP file
    expect(bytes.subarray(8, 12).toString()).toBe("WEBP");
  });
});
