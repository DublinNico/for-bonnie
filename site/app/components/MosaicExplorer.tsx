"use client";

/* eslint-disable @next/next/no-img-element -- pre-sized static assets */
import { useCallback, useEffect, useRef, useState } from "react";
import { photoLabel, tileUrl, type MosaicData, type TileSize } from "../lib/types";

/** screen = world * scale + offset, where one world unit is one mosaic cell */
type View = { scale: number; x: number; y: number };

const PREVIEW_SRC = "/mosaic-preview.webp";
const MAX_CELL_PX = 360; // most zoomed-in: one cell is this many CSS pixels
const TILES_FROM_PX = 16; // below this (device px per cell) the preview image is enough
const SM_FROM_PX = 100; // above this, swap the 96px tiles for the 400px ones

type Props = {
  data: MosaicData;
  /** Photo to highlight everywhere it appears (from "Show in mosaic") */
  focusPhoto: number | null;
  onClearFocus: () => void;
  onOpenPhoto: (photoIndex: number) => void;
};

export default function MosaicExplorer({ data, focusPhoto, onClearFocus, onOpenPhoto }: Props) {
  const { cols, rows, grid, photos } = data;

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Live values read by the draw loop (refs so pointer moves don't re-render React)
  const size = useRef({ w: 0, h: 0, dpr: 1 });
  const view = useRef<View>({ scale: 1, x: 0, y: 0 });
  const hover = useRef<number | null>(null);
  const selectedRef = useRef<number | null>(null);
  const focusRef = useRef<number | null>(focusPhoto);
  const images = useRef(new Map<string, HTMLImageElement>());
  const preview = useRef<HTMLImageElement | null>(null);
  const frame = useRef(0);

  // React state for the overlays (zoom %, mini-map, info card)
  const [ui, setUi] = useState({ view: { scale: 1, x: 0, y: 0 } as View, w: 0, h: 0, minScale: 1 });
  const [selected, setSelected] = useState<number | null>(null);

  // When "Show in mosaic" picks a new photo, close any open square's card.
  // (React's "adjust state when a prop changes" pattern — no effect needed.)
  const [prevFocus, setPrevFocus] = useState(focusPhoto);
  if (focusPhoto !== prevFocus) {
    setPrevFocus(focusPhoto);
    if (focusPhoto !== null) setSelected(null);
  }
  const [hint, setHint] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const minScale = useCallback(() => {
    const { w, h } = size.current;
    return Math.min(w / cols, h / rows) * 0.92;
  }, [cols, rows]);

  // ---------------------------------------------------------------- drawing
  // Batch redraws into the next animation frame. Calls the latest `draw` via a ref,
  // which breaks the cycle draw -> getImage -> (image loaded) -> scheduleDraw -> draw.
  const drawRef = useRef<() => void>(() => {});
  const scheduleDraw = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      drawRef.current();
    });
  }, []);

  const getImage = useCallback((tier: TileSize, photoIndex: number, request: boolean) => {
    const key = `${tier}/${photoIndex}`;
    let img = images.current.get(key);
    if (!img && request) {
      img = new Image();
      img.decoding = "async";
      img.onload = () => scheduleDraw();
      img.src = tileUrl(photos[photoIndex], tier);
      images.current.set(key, img);
    }
    return img && img.complete && img.naturalWidth > 0 ? img : null;
  }, [photos, scheduleDraw]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { w, h, dpr } = size.current;
    const { scale, x, y } = view.current;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingQuality = "high";

    // 1. The whole mosaic as one small image — instant, and enough when zoomed out
    const pre = preview.current;
    if (pre?.complete && pre.naturalWidth) ctx.drawImage(pre, x, y, cols * scale, rows * scale);

    // 2. Real tile photos for the cells on screen, once they're big enough to see
    const c0 = Math.max(0, Math.floor(-x / scale));
    const c1 = Math.min(cols - 1, Math.floor((w - x) / scale));
    const r0 = Math.max(0, Math.floor(-y / scale));
    const r1 = Math.min(rows - 1, Math.floor((h - y) / scale));
    const cellDevicePx = scale * dpr;

    if (cellDevicePx > TILES_FROM_PX) {
      const tier: TileSize = cellDevicePx > SM_FROM_PX ? "sm" : "xs";
      for (let r = r0; r <= r1; r++) {
        const top = Math.round(y + r * scale);
        const bottom = Math.round(y + (r + 1) * scale);
        for (let c = c0; c <= c1; c++) {
          const photo = grid[r * cols + c];
          const img = getImage(tier, photo, true) ?? (tier === "sm" ? getImage("xs", photo, false) : null);
          if (!img) continue;
          const left = Math.round(x + c * scale);
          const right = Math.round(x + (c + 1) * scale);
          ctx.drawImage(img, left, top, right - left, bottom - top);
        }
      }
    }

    // 3. "Show in mosaic": dim everything except the chosen photo's cells
    const focus = focusRef.current;
    if (focus !== null) {
      ctx.beginPath();
      ctx.rect(x, y, cols * scale, rows * scale);
      const cells: [number, number][] = [];
      grid.forEach((p, i) => {
        if (p === focus) cells.push([i % cols, Math.floor(i / cols)]);
      });
      for (const [c, r] of cells) ctx.rect(x + c * scale, y + r * scale, scale, scale);
      ctx.fillStyle = "rgba(21, 16, 12, 0.72)";
      ctx.fill("evenodd");
      ctx.strokeStyle = "#e3b57f";
      ctx.lineWidth = Math.max(1.5, Math.min(3, scale / 10));
      for (const [c, r] of cells) ctx.strokeRect(x + c * scale, y + r * scale, scale, scale);
    }

    // 4. Hovered / selected cell outlines
    ctx.strokeStyle = "#e3b57f";
    ctx.lineWidth = 2;
    for (const cell of [hover.current, selectedRef.current]) {
      if (cell === null) continue;
      ctx.strokeRect(x + (cell % cols) * scale, y + Math.floor(cell / cols) * scale, scale, scale);
    }
  }, [cols, rows, grid, getImage]);

  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  // ---------------------------------------------------------------- view changes
  const setView = useCallback(
    (next: View) => {
      const { w, h } = size.current;
      const min = minScale();
      const scale = Math.min(Math.max(next.scale, min), MAX_CELL_PX);
      const fit = (pos: number, worldSize: number, screen: number) => {
        const extent = worldSize * scale;
        return extent <= screen ? (screen - extent) / 2 : Math.min(0, Math.max(screen - extent, pos));
      };
      view.current = { scale, x: fit(next.x, cols, w), y: fit(next.y, rows, h) };
      setUi({ view: view.current, w, h, minScale: min });
      scheduleDraw();
    },
    [cols, rows, minScale, scheduleDraw],
  );

  const zoomAt = useCallback(
    (factor: number, sx: number, sy: number) => {
      const v = view.current;
      const min = minScale();
      const scale = Math.min(Math.max(v.scale * factor, min), MAX_CELL_PX);
      const k = scale / v.scale;
      setView({ scale, x: sx - (sx - v.x) * k, y: sy - (sy - v.y) * k });
    },
    [minScale, setView],
  );

  const reset = useCallback(() => setView({ scale: 0, x: 0, y: 0 }), [setView]);

  // ---------------------------------------------------------------- setup
  useEffect(() => {
    const img = new Image();
    img.onload = () => scheduleDraw();
    img.src = PREVIEW_SRC;
    preview.current = img;
  }, [scheduleDraw]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const wasFitted = view.current.scale <= minScale() * 1.001 || size.current.w === 0;
      size.current = { w, h, dpr };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      if (wasFitted) reset();
      else setView(view.current);
      draw();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [draw, minScale, reset, setView]);

  // Highlight a photo when "Show in mosaic" is used
  useEffect(() => {
    focusRef.current = focusPhoto;
    if (focusPhoto !== null) reset();
    scheduleDraw();
  }, [focusPhoto, reset, scheduleDraw]);

  // The canvas reads the selected cell from a ref; keep it in sync with React state
  useEffect(() => {
    selectedRef.current = selected;
    scheduleDraw();
  }, [selected, scheduleDraw]);

  // ---------------------------------------------------------------- input
  const cellAt = useCallback(
    (sx: number, sy: number) => {
      const { scale, x, y } = view.current;
      const c = Math.floor((sx - x) / scale);
      const r = Math.floor((sy - y) / scale);
      return c >= 0 && c < cols && r >= 0 && r < rows ? r * cols + c : null;
    },
    [cols, rows],
  );

  const select = setSelected;

  // Wheel needs a non-passive native listener so Ctrl + scroll can block page zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - rect.left, e.clientY - rect.top);
      } else {
        setHint(true);
        clearTimeout(hintTimer.current);
        hintTimer.current = setTimeout(() => setHint(false), 1400);
      }
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    startX: number;
    startY: number;
    view: View;
    moved: boolean;
    pinchDist?: number;
    pinchMid?: { x: number; y: number };
  } | null>(null);

  const localPoint = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startGesture = () => {
    const pts = [...pointers.current.values()];
    if (pts.length === 1) {
      gesture.current = { startX: pts[0].x, startY: pts[0].y, view: view.current, moved: gesture.current?.moved ?? false };
    } else if (pts.length >= 2) {
      const [a, b] = pts;
      gesture.current = {
        startX: 0,
        startY: 0,
        view: view.current,
        moved: true,
        pinchDist: Math.hypot(a.x - b.x, a.y - b.y),
        pinchMid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      };
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    canvasRef.current!.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, localPoint(e));
    if (pointers.current.size === 1) gesture.current = null;
    startGesture();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const p = localPoint(e);
    if (!pointers.current.has(e.pointerId)) {
      if (e.pointerType === "mouse") {
        hover.current = cellAt(p.x, p.y);
        scheduleDraw();
      }
      return;
    }
    pointers.current.set(e.pointerId, p);
    const g = gesture.current;
    if (!g) return;
    const pts = [...pointers.current.values()];

    if (pts.length >= 2 && g.pinchDist && g.pinchMid) {
      const [a, b] = pts;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const scale = g.view.scale * (dist / g.pinchDist);
      // Keep the point that was under the fingers' midpoint under it
      const wx = (g.pinchMid.x - g.view.x) / g.view.scale;
      const wy = (g.pinchMid.y - g.view.y) / g.view.scale;
      const clamped = Math.min(Math.max(scale, minScale()), MAX_CELL_PX);
      setView({ scale: clamped, x: mid.x - wx * clamped, y: mid.y - wy * clamped });
    } else if (pts.length === 1) {
      const dx = p.x - g.startX;
      const dy = p.y - g.startY;
      if (Math.abs(dx) + Math.abs(dy) > 5) g.moved = true;
      if (g.moved) setView({ ...g.view, x: g.view.x + dx, y: g.view.y + dy });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    const g = gesture.current;
    const wasTap = pointers.current.size === 1 && g && !g.moved && e.type === "pointerup";
    pointers.current.delete(e.pointerId);
    if (wasTap) {
      const p = localPoint(e);
      const cell = cellAt(p.x, p.y);
      select(cell === selectedRef.current ? null : cell);
    }
    if (pointers.current.size > 0) startGesture();
    else gesture.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const { w, h } = size.current;
    const v = view.current;
    const step = 80;
    const actions: Record<string, () => void> = {
      "+": () => zoomAt(1.5, w / 2, h / 2),
      "=": () => zoomAt(1.5, w / 2, h / 2),
      "-": () => zoomAt(1 / 1.5, w / 2, h / 2),
      "0": reset,
      ArrowLeft: () => setView({ ...v, x: v.x + step }),
      ArrowRight: () => setView({ ...v, x: v.x - step }),
      ArrowUp: () => setView({ ...v, y: v.y + step }),
      ArrowDown: () => setView({ ...v, y: v.y - step }),
      Escape: () => select(null),
    };
    const action = actions[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  };

  // ---------------------------------------------------------------- overlays
  const { scale, x, y } = ui.view;
  const zoomed = scale > ui.minScale * 1.01;
  const zoomPercent = Math.round((scale / ui.minScale) * 100);
  const sliderValue = Math.log(scale / ui.minScale) / Math.log(MAX_CELL_PX / ui.minScale);

  const mini = {
    left: (Math.max(0, -x / scale) / cols) * 100,
    top: (Math.max(0, -y / scale) / rows) * 100,
    width: (Math.min(ui.w / scale, cols) / cols) * 100,
    height: (Math.min(ui.h / scale, rows) / rows) * 100,
  };

  const jumpTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const wx = ((e.clientX - rect.left) / rect.width) * cols;
    const wy = ((e.clientY - rect.top) / rect.height) * rows;
    const s = zoomed ? scale : ui.minScale * 4;
    setView({ scale: s, x: ui.w / 2 - wx * s, y: ui.h / 2 - wy * s });
  };

  const selectedPhoto = selected === null ? null : grid[selected];
  let cardStyle: React.CSSProperties | undefined;
  if (selected !== null && ui.w >= 900) {
    const cx = x + (selected % cols) * scale;
    const cy = y + Math.floor(selected / cols) * scale;
    const left = cx + scale + 16 + 280 < ui.w - 240 ? cx + scale + 16 : cx - 16 - 280;
    cardStyle = { left: Math.max(16, left), top: Math.min(Math.max(16, cy - 10), ui.h - 130) };
  }

  return (
    <section className="explorer" id="mosaic" aria-label="Interactive mosaic" ref={containerRef}>
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="img"
        aria-label={`Mosaic of Bonnie made from ${photos.length} photos. Use plus and minus to zoom, arrow keys to move.`}
        style={{ touchAction: zoomed ? "none" : "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => {
          hover.current = null;
          scheduleDraw();
        }}
        onDoubleClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          zoomAt(2.5, e.clientX - rect.left, e.clientY - rect.top);
        }}
        onKeyDown={onKeyDown}
      />
      <div className="explorer-shade" />

      <div className="explorer-copy">
        <span className="label">The mosaic</span>
        <h2>
          Look
          <br />
          closer.
        </h2>
        <p>
          Every square is one of our photos of her, picked to match the colour of that spot. Pinch or Ctrl + scroll to
          zoom; click a square to open it.
        </p>
      </div>

      <div className="explorer-controls">
        {(zoomed || ui.w >= 900) && (
          <div className="explorer-mini glass" onClick={jumpTo} title="Jump to a spot">
            <div>
              <img src={PREVIEW_SRC} alt="" draggable={false} />
              <span
                style={{ left: `${mini.left}%`, top: `${mini.top}%`, width: `${mini.width}%`, height: `${mini.height}%` }}
              />
            </div>
          </div>
        )}
        <div className="explorer-zoom glass">
          <button
            className="round-btn"
            aria-label="Zoom out"
            disabled={!zoomed}
            onClick={() => zoomAt(1 / 1.6, ui.w / 2, ui.h / 2)}
          >
            −
          </button>
          <output aria-live="polite">{zoomPercent}%</output>
          <button
            className="round-btn"
            aria-label="Zoom in"
            disabled={scale >= MAX_CELL_PX}
            onClick={() => zoomAt(1.6, ui.w / 2, ui.h / 2)}
          >
            +
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={Number.isFinite(sliderValue) ? sliderValue : 0}
            aria-label="Zoom level"
            onChange={(e) => {
              const target = ui.minScale * Math.pow(MAX_CELL_PX / ui.minScale, Number(e.target.value));
              zoomAt(target / scale, ui.w / 2, ui.h / 2);
            }}
          />
        </div>
        <button className="explorer-reset glass" onClick={reset}>
          Reset view
        </button>
      </div>

      {focusPhoto !== null && (
        <div className="explorer-focus glass" role="status">
          {photoLabel(photos[focusPhoto])} · {photos[focusPhoto].uses} places
          <button onClick={onClearFocus}>Clear</button>
        </div>
      )}

      {selectedPhoto !== null && (
        <div className="explorer-card glass" style={cardStyle}>
          <img src={tileUrl(photos[selectedPhoto], "sm")} alt="" />
          <div>
            <div className="t1">{photoLabel(photos[selectedPhoto])}</div>
            <div className="t2">Used {photos[selectedPhoto].uses} times in the mosaic</div>
          </div>
          <button className="go" aria-label={`Open ${photoLabel(photos[selectedPhoto])}`} onClick={() => onOpenPhoto(selectedPhoto)}>
            →
          </button>
          <button className="close" aria-label="Close" onClick={() => select(null)}>
            ×
          </button>
        </div>
      )}

      <div className="explorer-hint glass" style={{ opacity: hint ? 1 : 0 }} aria-hidden>
        Hold Ctrl and scroll to zoom
      </div>
    </section>
  );
}
