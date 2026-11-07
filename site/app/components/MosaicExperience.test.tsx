// App state: MosaicExperience links the explorer, gallery and photo view together.
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { data, stubBrowserLayout } from "../../test/helpers";
import MosaicExperience from "./MosaicExperience";

beforeEach(() => stubBrowserLayout(800, 600));

function setup() {
  const user = userEvent.setup();
  render(<MosaicExperience data={data} between={<p>How it was made</p>} />);
  return { user };
}

const gallery = () => within(document.getElementById("gallery") as HTMLElement);
const viewer = () => screen.queryByRole("dialog");

describe("MosaicExperience (app state)", () => {
  it("FT-054 lays out the explorer, then the in-between section, then the gallery", () => {
    setup();
    const mosaic = document.getElementById("mosaic")!;
    const between = screen.getByText("How it was made");
    const galleryEl = document.getElementById("gallery")!;
    expect(mosaic.compareDocumentPosition(between) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(between.compareDocumentPosition(galleryEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(viewer()).toBeNull();
  });

  it("FT-055 clicking a gallery photo opens it in the viewer, and Close shuts it", async () => {
    const { user } = setup();
    await user.click(gallery().getByRole("img", { name: "Photo 002" }));
    expect(viewer()).toHaveAccessibleName("Photo 002");

    await user.click(within(viewer()!).getByRole("button", { name: "Close" }));
    expect(viewer()).toBeNull();
  });

  it("FT-056 'next' in the viewer follows the gallery's current sort order", async () => {
    const { user } = setup();
    await user.click(gallery().getByRole("button", { name: "Most used" })); // 3, 1, 2, 4
    await user.click(gallery().getByRole("img", { name: "Photo 003" }));
    expect(within(viewer()!).getByText("1 of 4")).toBeInTheDocument();

    await user.click(within(viewer()!).getByRole("button", { name: "Next photo" }));
    expect(viewer()).toHaveAccessibleName("Photo 001");
  });

  it("FT-057 'Show in mosaic' closes the viewer, scrolls up and highlights that photo; Clear removes it", async () => {
    const { user } = setup();
    await user.click(gallery().getByRole("img", { name: "Photo 003" }));
    await user.click(within(viewer()!).getByRole("button", { name: "Show in mosaic" }));

    expect(viewer()).toBeNull();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    const banner = document.querySelector(".explorer-focus")!;
    expect(banner).toHaveTextContent("Photo 003 · 4 places");

    await user.click(within(banner as HTMLElement).getByRole("button", { name: "Clear" }));
    expect(document.querySelector(".explorer-focus")).toBeNull();
  });

  it("FT-058 opening a photo from the mosaic browses all photos in number order", async () => {
    const { user } = setup();
    const canvas = screen.getByRole("img", { name: /Mosaic of Bonnie/ });
    const point = { pointerId: 1, pointerType: "mouse", button: 0, clientX: 308, clientY: 208 }; // Photo 003's square
    fireEvent.pointerDown(canvas, point);
    fireEvent.pointerUp(canvas, point);

    await user.click(screen.getByRole("button", { name: "Open Photo 003" }));

    expect(viewer()).toHaveAccessibleName("Photo 003");
    expect(within(viewer()!).getByText("3 of 4")).toBeInTheDocument();
  });
});
