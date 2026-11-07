// Unit + component tests (Vitest). End-to-end tests live in e2e/ and run with
// Playwright instead — they're excluded here so the two runners never overlap.
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    // A lightweight fake browser page, so components can render without a real browser
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
    // Tests sit next to the code they test: app/**/Thing.test.tsx
    include: ["app/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      include: ["app/**/*.{ts,tsx}"],
      exclude: ["app/**/*.test.{ts,tsx}"],
      reporter: ["text", "html"], // summary in the terminal + coverage/index.html
    },
  },
});
