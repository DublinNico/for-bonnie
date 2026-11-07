// End-to-end tests (Playwright): drive a real browser against the production
// build of the site. Specs live in e2e/ and are never picked up by Vitest.
import { defineConfig, devices } from "@playwright/test";

const PORT = 3100; // its own port, so it never clashes with `npm run dev` on 3000

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // a leftover test.only() fails CI instead of skipping everything else
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry", // step-by-step recording when a test fails and is retried
    screenshot: "only-on-failure",
  },

  // Every test runs twice: once on a desktop, once on a 375px-wide phone
  projects: [
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-375",
      use: {
        ...devices["Pixel 5"], // a Chromium phone: mobile user agent, touch, high-DPI screen
        viewport: { width: 375, height: 667 },
      },
    },
  ],

  // Build the site and serve the production version, as the Next.js docs recommend.
  // Locally, an already-running server on this port is reused to save time.
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
