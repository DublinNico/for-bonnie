// Runs before every unit/component test file.
import "@testing-library/jest-dom/vitest"; // adds readable checks like expect(el).toBeInTheDocument()
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Remove whatever the previous test rendered, so tests can't affect each other
afterEach(() => cleanup());
