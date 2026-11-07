import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Photo } from "../lib/types";
import Gallery from "./Gallery";

const photos: Photo[] = [
  { id: "tile_001", number: 1, uses: 5 },
  { id: "tile_002", number: 2, uses: 30 },
  { id: "tile_003", number: 3, uses: 12 },
  { id: "tile_004", number: 4, uses: 5 }, // same usage as photo 1: ties are broken by number
  { id: "tile_005", number: 5, uses: 0 }, // never used in the mosaic
];

/** The photo labels in the order the gallery shows them */
const shownOrder = () =>
  within(document.querySelector(".gallery-grid") as HTMLElement)
    .getAllByRole("img")
    .map((img) => img.getAttribute("alt"));

function setup() {
  const onOpen = vi.fn();
  const user = userEvent.setup();
  render(<Gallery photos={photos} onOpen={onOpen} />);
  return { onOpen, user };
}

describe("Gallery", () => {
  it("FT-026 starts in photo-number order, showing every photo", () => {
    setup();
    expect(shownOrder()).toEqual(["Photo 001", "Photo 002", "Photo 003", "Photo 004", "Photo 005"]);
    expect(screen.getAllByText("5 photos").length).toBeGreaterThan(0);
  });

  it("FT-027 'Most used' puts the most-used photos first", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Most used" }));
    expect(shownOrder()).toEqual(["Photo 002", "Photo 003", "Photo 001", "Photo 004", "Photo 005"]);
  });

  it("FT-028 'Least used' puts unused photos first, breaking ties by number", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Least used" }));
    expect(shownOrder()).toEqual(["Photo 005", "Photo 001", "Photo 004", "Photo 003", "Photo 002"]);
  });

  it("FT-029 the chosen sort button is marked as pressed, and 'In order' goes back", async () => {
    const { user } = setup();
    const inOrder = screen.getByRole("button", { name: "In order" });
    const mostUsed = screen.getByRole("button", { name: "Most used" });
    expect(inOrder).toHaveAttribute("aria-pressed", "true");

    await user.click(mostUsed);
    expect(mostUsed).toHaveAttribute("aria-pressed", "true");
    expect(inOrder).toHaveAttribute("aria-pressed", "false");

    await user.click(inOrder);
    expect(shownOrder()[0]).toBe("Photo 001");
  });

  it("FT-030 captions show how often a photo is used, or that it isn't", () => {
    setup();
    expect(screen.getByText("Used 30× in the mosaic")).toBeInTheDocument();
    expect(screen.getByText("Not in the mosaic")).toBeInTheDocument();
  });

  it("FT-031 clicking a photo opens it, passing the current order for next/previous", async () => {
    const { onOpen, user } = setup();
    await user.click(screen.getByRole("button", { name: "Most used" }));
    await user.click(screen.getByRole("img", { name: "Photo 003" }));

    expect(onOpen).toHaveBeenCalledWith(2, [1, 2, 0, 3, 4]); // photo 3 is index 2; most-used order
  });

  it("FT-032 photos load the 400px image, lazily", () => {
    setup();
    const img = screen.getByRole("img", { name: "Photo 001" });
    expect(img).toHaveAttribute("src", "/tiles/sm/tile_001.webp");
    expect(img).toHaveAttribute("loading", "lazy");
  });
});
