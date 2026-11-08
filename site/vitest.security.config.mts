// Security tests (tests/security/). HTTP-level checks run against the real production
// build in-process (like the integration tests); rendering checks use happy-dom per file.
// Run with `npm run test:security` (it builds the site first).
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["tests/security/**/*.test.{ts,tsx}"],
    fileParallelism: false, // one Next.js server at a time
    hookTimeout: 120_000,
    testTimeout: 60_000,
  },
});
