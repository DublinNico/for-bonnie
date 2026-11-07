// Shared setup for every end-to-end test. Import `test` and `expect` from here,
// not from "@playwright/test", so the network guard below always applies.
import { test as base, expect } from "@playwright/test";

type Fixtures = {
  /** Fails the test if the page tries to reach anything except the local test server. */
  networkGuard: void;
};

export const test = base.extend<Fixtures>({
  networkGuard: [
    async ({ page, baseURL }, use) => {
      // The site has no backend and calls no outside services (even fonts are self-hosted),
      // so there's nothing to mock. This guard proves it stays that way: any request to
      // another host is blocked, and the test fails listing what was attempted.
      const allowedOrigin = new URL(baseURL!).origin;
      const blocked: string[] = [];

      await page.route("**/*", (route) => {
        const url = route.request().url();
        if (url.startsWith(allowedOrigin)) return route.continue();
        blocked.push(url);
        return route.abort();
      });

      await use();

      expect(blocked, "The page tried to contact outside services").toEqual([]);
    },
    { auto: true }, // runs for every test without having to ask for it
  ],
});

export { expect };
