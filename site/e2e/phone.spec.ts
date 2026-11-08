// Key pages at 375px (the mobile-375 project). Each test measures real positions,
// so a layout regression fails here instead of being spotted by eye later.
import { expect, test } from "./fixtures";

test.beforeEach(({ isMobile }) => {
  test.skip(!isMobile, "phone-size checks run in the mobile-375 project");
});

test("ET-013 nothing on the page is wider than the phone screen", async ({ page }) => {
  await page.goto("/");
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(innerWidth).toBe(375);
  expect(scrollWidth).toBeLessThanOrEqual(375); // no sideways scrolling
});

test("ET-014 the hero stacks the title above the portrait, both fully on screen", async ({ page }) => {
  await page.goto("/");
  const title = (await page.getByRole("heading", { level: 1 }).boundingBox())!;
  const portrait = (await page.locator(".hero-panel").boundingBox())!;

  expect(title.y).toBeLessThan(portrait.y);
  for (const box of [title, portrait]) {
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(375);
  }
});

test("ET-015 the mosaic fills the screen, and a tapped square's card fits on it", async ({ page }) => {
  await page.goto("/#mosaic");
  const explorer = page.locator("#mosaic");
  await expect(explorer).toBeInViewport();
  const box = (await explorer.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(page.viewportSize()!.height - 1);

  await page.getByRole("img", { name: /Mosaic of Bonnie/ }).tap();
  const card = (await page.locator(".explorer-card").boundingBox())!;
  expect(card.x).toBeGreaterThanOrEqual(0);
  expect(card.x + card.width).toBeLessThanOrEqual(375);
});

test("ET-016 swiping still scrolls the page when zoomed out, and pans the mosaic when zoomed in", async ({ page }) => {
  await page.goto("/#mosaic");
  const canvas = page.getByRole("img", { name: /Mosaic of Bonnie/ });
  await expect(canvas).toHaveCSS("touch-action", "pan-y");

  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(canvas).toHaveCSS("touch-action", "none");
});

test("ET-017 the gallery shows three columns", async ({ page }) => {
  await page.goto("/#gallery");
  const xs = await page.locator(".gallery-item").evaluateAll((items) =>
    items.slice(0, 9).map((el) => Math.round(el.getBoundingClientRect().left)),
  );
  expect(new Set(xs).size).toBe(3);
});

test("ET-018 the polaroids sit in a row of three and a row of two, without overlapping", async ({ page }) => {
  await page.goto("/#for-bonnie");
  const boxes = await page.locator(".polaroid").evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    }),
  );
  const rows = new Map<number, number>();
  for (const b of boxes) rows.set(Math.round(b.top / 60), (rows.get(Math.round(b.top / 60)) ?? 0) + 1);
  expect([...rows.values()].sort()).toEqual([2, 3]);

  // Only the photo areas matter: the tilted frames may touch, the photos must not overlap
  const photos = await page.locator(".polaroid img").evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()));
  for (let i = 0; i < photos.length; i++)
    for (let j = i + 1; j < photos.length; j++) {
      const [a, b] = [photos[i], photos[j]];
      const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      expect(overlapX > 2 && overlapY > 2, `photos ${i} and ${j} overlap`).toBe(false);
    }
});

test("ET-019 the photo view uses the full width, with its buttons on screen", async ({ page }) => {
  await page.goto("/#gallery");
  await page.locator("#gallery").getByRole("img", { name: "Photo 001" }).tap();
  const viewer = page.getByRole("dialog");
  const photo = (await viewer.getByRole("img").boundingBox())!;
  expect(photo.width).toBeGreaterThanOrEqual(370);

  const show = viewer.getByRole("button", { name: "Show in mosaic" });
  await show.scrollIntoViewIfNeeded();
  await expect(show).toBeInViewport();
});
