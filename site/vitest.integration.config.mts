// Integration tests: the real production build of the site, served by Next.js
// inside the test process, called over HTTP with Supertest.
// Run with `npm run test:integration` (it builds the site first).
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // real HTTP, no fake browser
    include: ["integration/**/*.test.ts"],
    fileParallelism: false, // one Next.js server at a time
    hookTimeout: 120_000, // starting Next.js takes a few seconds
    testTimeout: 60_000, // some tests make hundreds of requests
  },
});
