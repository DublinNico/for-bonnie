import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { data } from "../../test/helpers";
import Lightbox from "./Lightbox";

// data: photo 1 used 3x, photo 2 once, photo 3 4x, photo 4 never
function setup(position: number, order = [0, 1, 2, 3]) {
  const handlers = { onNavigate: vi.fn(), onClose: vi.fn(), onShowInMosaic: vi.fn() };
  const user = userEvent.setup();
  const view = render(<Lightbox data={data} order={order} position={position} {...handlers} />);
  return { ...handlers, user, view };
}

describe("Lightbox (full-size photo view)", () => {
  it("FT-033 shows the photo full size, its name and where it is in the list", () => {
    setup(2);
    expect(screen.getByRole("dialog", { name: "Photo 003" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Photo 003" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Photo 003" })).toHaveAttribute("src", "/tiles/lg/tile_003.webp");
    expect(screen.getByText("3 of 4")).toBeInTheDocument();
  });

  it("FT-034 says how often the photo is used: N times, once, or not used", () => {
    const { view } = setup(2);
    expect(screen.getByText("4 times")).toBeInTheDocument();
    view.unmount();
    setup(1);
    expect(screen.getByText("Once")).toBeInTheDocument();
  });

  it("FT-035 a photo the mosaic never used says so, and has no 'Show in mosaic' button", () => {
    setup(3);
    expect(screen.getByText("Not used")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show in mosaic" })).not.toBeInTheDocument();
  });

  it("FT-036 'Show in mosaic' passes on which photo to highlight", async () => {
    const { user, onShowInMosaic } = setup(2, [3, 1, 2, 0]); // position 2 in this order = photo index 2
    await user.click(screen.getByRole("button", { name: "Show in mosaic" }));
    expect(onShowInMosaic).toHaveBeenCalledWith(2);
  });

  it("FT-037 previous/next buttons move through the list, and hide at either end", async () => {
    const first = setup(0);
    expect(screen.queryByRole("button", { name: "Previous photo" })).not.toBeInTheDocument();
    await first.user.click(screen.getByRole("button", { name: "Next photo" }));
    expect(first.onNavigate).toHaveBeenCalledWith(1);
    first.view.unmount();

    const last = setup(3);
    expect(screen.queryByRole("button", { name: "Next photo" })).not.toBeInTheDocument();
    await last.user.click(screen.getByRole("button", { name: "Previous photo" }));
    expect(last.onNavigate).toHaveBeenCalledWith(2);
  });

  it("FT-038 arrow keys move between photos and Escape closes; nothing happens past the ends", async () => {
    const { user, onNavigate, onClose } = setup(3);
    await user.keyboard("{ArrowRight}"); // already last: ignored
    expect(onNavigate).not.toHaveBeenCalled();
    await user.keyboard("{ArrowLeft}");
    expect(onNavigate).toHaveBeenCalledWith(2);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("FT-039 the page behind can't scroll while open, and scrolls again after", () => {
    const { view } = setup(0);
    expect(document.body.style.overflow).toBe("hidden");
    view.unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("FT-040 keyboard focus moves to Close, then back to where it was", () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();

    const { view } = setup(0);
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    view.unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it("FT-041 shows a dot for each place it appears, and links to the full-size download", () => {
    const { view } = setup(0); // photo 1: used 3 times
    expect(view.container.querySelectorAll(".lightbox-map i")).toHaveLength(3);
    const download = screen.getByRole("link", { name: "Download" });
    expect(download).toHaveAttribute("href", "/tiles/lg/tile_001.webp");
    expect(download).toHaveAttribute("download", "bonnie-tile_001.webp");
  });
});
