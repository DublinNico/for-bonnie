import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Photo } from "../lib/types";
import Gallery from "./Gallery";

const photos: Photo[] = [
  { id: "tile_001", number: 1, uses: 5 },
  { id: "tile_002", number: 2, uses: 30 },
  { id: "tile_003", number: 3, uses: 12 },
];

/** The photo labels in the order the gallery shows them */
const shownOrder = () =>
  within(document.querySelector(".gallery-grid") as HTMLElement)
    .getAllByRole("img")
    .map((img) => img.getAttribute("alt"));

describe("Gallery", () => {
  it("shows photos in number order, and re-sorts by usage when asked", async () => {
    const user = userEvent.setup();
    render(<Gallery photos={photos} onOpen={vi.fn()} />);

    expect(shownOrder()).toEqual(["Photo 001", "Photo 002", "Photo 003"]);

    await user.click(screen.getByRole("button", { name: "Most used" }));

    expect(shownOrder()).toEqual(["Photo 002", "Photo 003", "Photo 001"]);
  });
});
