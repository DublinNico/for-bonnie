// Smoke test: proves the end-to-end setup works. The real feature tests come next.
import { expect, test } from "./fixtures";

test("ET-001 home page loads with its title and no errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");

  await expect(page).toHaveTitle("Bonnie");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bonnie");
  expect(errors).toEqual([]);
});
