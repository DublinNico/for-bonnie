import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { data, stubBrowserLayout } from "../../test/helpers";
import MosaicExplorer from "./MosaicExplorer";

// An 800 x 600 explorer showing the 4 x 2 sample mosaic. Fully zoomed out each square is
// 184 px and the mosaic sits at (32, 116), so (308, 208) is row 0, column 1 -> Photo 003.
const SQUARE_PHOTO_003 = { clientX: 308, clientY: 208 };

beforeEach(() => stubBrowserLayout(800, 600));

function setup(focusPhoto: number | null = null) {
  const onOpenPhoto = vi.fn();
  const onClearFocus = vi.fn();
  const user = userEvent.setup();
  const view = render(
    <MosaicExplorer data={data} focusPhoto={focusPhoto} onOpenPhoto={onOpenPhoto} onClearFocus={onClearFocus} />,
  );
  const canvas = screen.getByRole("img", { name: /Mosaic of Bonnie/ });
  return { onOpenPhoto, onClearFocus, user, view, canvas };
}

const zoomOutput = () => document.querySelector(".explorer-zoom output")!.textContent;

function tap(canvas: HTMLElement, point: { clientX: number; clientY: number }) {
  const event = { pointerId: 1, pointerType: "mouse", button: 0, ...point };
  fireEvent.pointerDown(canvas, event);
  fireEvent.pointerUp(canvas, event);
}

describe("MosaicExplorer", () => {
  it("FT-042 the mosaic has a description for screen readers and is keyboard-focusable", () => {
    const { canvas } = setup();
    expect(canvas).toHaveAccessibleName(/Mosaic of Bonnie made from 4 photos/);
    expect(canvas).toHaveAttribute("tabindex", "0");
  });

  it("FT-043 starts fully zoomed out: 100%, with zoom-out disabled", () => {
    setup();
    expect(zoomOutput()).toBe("100%");
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeEnabled();
  });

  it("FT-044 the + and − buttons zoom in and back out", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(zoomOutput()).toBe("160%");
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(zoomOutput()).toBe("100%");
  });

  it("FT-045 zoom stops at the maximum, and + is then disabled", async () => {
    const { user } = setup();
    const zoomIn = screen.getByRole("button", { name: "Zoom in" });
    await user.click(zoomIn);
    await user.click(zoomIn); // 184 x 1.6 x 1.6 is past the 360 px limit
    expect(zoomOutput()).toBe("196%"); // 360 / 184
    expect(zoomIn).toBeDisabled();
  });

  it("FT-046 the zoom slider goes from fully zoomed out to the maximum", () => {
    setup();
    const slider = screen.getByRole("slider", { name: "Zoom level" });
    fireEvent.change(slider, { target: { value: "1" } });
    expect(zoomOutput()).toBe("196%");
    fireEvent.change(slider, { target: { value: "0" } });
    expect(zoomOutput()).toBe("100%");
  });

  it("FT-047 keyboard: + zooms in, − zooms out, 0 resets", async () => {
    const { user, canvas } = setup();
    canvas.focus();
    await user.keyboard("+");
    expect(zoomOutput()).toBe("150%");
    await user.keyboard("-");
    expect(zoomOutput()).toBe("100%");
    await user.keyboard("++0");
    expect(zoomOutput()).toBe("100%");
  });

  it("FT-048 tapping a square shows which photo it is, and the arrow opens it", async () => {
    const { user, canvas, onOpenPhoto } = setup();
    tap(canvas, SQUARE_PHOTO_003);

    expect(screen.getByText("Photo 003")).toBeInTheDocument();
    expect(screen.getByText("Used 4 times in the mosaic")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open Photo 003" }));
    expect(onOpenPhoto).toHaveBeenCalledWith(2);
  });

  it("FT-049 tapping the same square again, or ×, closes the card", async () => {
    const { user, canvas } = setup();
    tap(canvas, SQUARE_PHOTO_003);
    tap(canvas, SQUARE_PHOTO_003);
    expect(screen.queryByText("Photo 003")).not.toBeInTheDocument();

    tap(canvas, SQUARE_PHOTO_003);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByText("Photo 003")).not.toBeInTheDocument();
  });

  it("FT-050 tapping outside the mosaic, or dragging, doesn't open a card", () => {
    const { canvas } = setup();
    tap(canvas, { clientX: 10, clientY: 208 }); // left of the mosaic
    expect(document.querySelector(".explorer-card")).toBeNull();

    // A drag: press, move 40 px, release on a square
    fireEvent.pointerDown(canvas, { pointerId: 1, pointerType: "mouse", button: 0, ...SQUARE_PHOTO_003 });
    fireEvent.pointerMove(canvas, { pointerId: 1, pointerType: "mouse", clientX: 348, clientY: 208 });
    fireEvent.pointerUp(canvas, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 348, clientY: 208 });
    expect(document.querySelector(".explorer-card")).toBeNull();
  });

  it("FT-051 Ctrl + scroll zooms; plain scrolling shows a hint instead", () => {
    const { canvas } = setup();
    const hint = screen.getByText("Hold Ctrl and scroll to zoom");

    fireEvent.wheel(canvas, { deltaY: -100 });
    expect(zoomOutput()).toBe("100%");
    expect(hint).toHaveStyle({ opacity: "1" });

    // happy-dom drops ctrlKey (and position) from wheel events, so set them on the event directly
    const ctrlScroll = new WheelEvent("wheel", { bubbles: true, cancelable: true });
    for (const [key, value] of Object.entries({ ctrlKey: true, deltaY: -20, clientX: 400, clientY: 300 })) {
      Object.defineProperty(ctrlScroll, key, { value });
    }
    fireEvent(canvas, ctrlScroll);
    expect(Number.parseInt(zoomOutput()!)).toBeGreaterThan(100);
    expect(ctrlScroll.defaultPrevented).toBe(true); // the browser's own page zoom is blocked
  });

  it("FT-052 'Show in mosaic' shows how many places the photo is used, with a Clear button", async () => {
    const { user, onClearFocus } = setup(0);
    // (the zoom label is an <output>, which also counts as a "status", so target the banner)
    expect(document.querySelector(".explorer-focus")).toHaveTextContent("Photo 001 · 3 places");
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClearFocus).toHaveBeenCalled();
  });

  it("FT-053 highlighting a photo closes any open square's card", () => {
    const { canvas, view, onOpenPhoto, onClearFocus } = setup(null);
    tap(canvas, SQUARE_PHOTO_003);
    expect(screen.getByText("Photo 003")).toBeInTheDocument();

    view.rerender(<MosaicExplorer data={data} focusPhoto={0} onOpenPhoto={onOpenPhoto} onClearFocus={onClearFocus} />);
    expect(screen.queryByText("Used 4 times in the mosaic")).not.toBeInTheDocument();
  });
});
