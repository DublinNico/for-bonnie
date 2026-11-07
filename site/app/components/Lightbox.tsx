"use client";

/* eslint-disable @next/next/no-img-element -- pre-sized static assets */
import { useEffect, useRef } from "react";
import { photoLabel, tileUrl, type MosaicData } from "../lib/types";

type Props = {
  data: MosaicData;
  /** Photo indexes in the order the viewer is browsing them */
  order: number[];
  /** Position within `order` currently shown */
  position: number;
  onNavigate: (position: number) => void;
  onClose: () => void;
  onShowInMosaic: (photoIndex: number) => void;
};

export default function Lightbox({ data, order, position, onNavigate, onClose, onShowInMosaic }: Props) {
  const { photos, grid, cols, rows } = data;
  const photoIndex = order[position];
  const photo = photos[photoIndex];
  const closeRef = useRef<HTMLButtonElement>(null);

  const hasPrev = position > 0;
  const hasNext = position < order.length - 1;

  // Every cell that uses this photo, as % positions for the little map
  const spots: { left: number; top: number }[] = [];
  grid.forEach((p, i) => {
    if (p === photoIndex) spots.push({ left: ((i % cols) + 0.5) / cols * 100, top: (Math.floor(i / cols) + 0.5) / rows * 100 });
  });

  // Lock page scroll and move keyboard focus into the dialog while it's open
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onNavigate(position - 1);
      if (e.key === "ArrowRight" && hasNext) onNavigate(position + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasNext, hasPrev, onClose, onNavigate, position]);

  // Warm the cache for the neighbours so next/previous feels instant
  useEffect(() => {
    for (const p of [position - 1, position + 1]) {
      if (p >= 0 && p < order.length) new Image().src = tileUrl(photos[order[p]], "lg");
    }
  }, [order, photos, position]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={photoLabel(photo)}>
      <div className="lightbox-bar">
        <span className="label">
          {position + 1} of {order.length}
        </span>
        <button ref={closeRef} className="round-btn" aria-label="Close" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="lightbox-photo">
        <img key={photo.id} src={tileUrl(photo, "lg")} alt={photoLabel(photo)} />
        {hasPrev && (
          <button className="round-btn lightbox-arrow prev" aria-label="Previous photo" onClick={() => onNavigate(position - 1)}>
            ←
          </button>
        )}
        {hasNext && (
          <button className="round-btn lightbox-arrow next" aria-label="Next photo" onClick={() => onNavigate(position + 1)}>
            →
          </button>
        )}
      </div>

      <div className="lightbox-info">
        <h2>{photoLabel(photo)}</h2>
        <div className="lightbox-row">
          <span>In the mosaic</span>
          <b>{photo.uses === 0 ? "Not used" : photo.uses === 1 ? "Once" : `${photo.uses} times`}</b>
        </div>
        <div className="lightbox-btns">
          {photo.uses > 0 && (
            <button className="btn primary" onClick={() => onShowInMosaic(photoIndex)}>
              Show in mosaic
            </button>
          )}
          <a className="btn ghost" href={tileUrl(photo, "lg")} download={`bonnie-${photo.id}.webp`}>
            Download
          </a>
        </div>
        {spots.length > 0 && (
          <div className="lightbox-where">
            <div className="lightbox-map" aria-hidden>
              <img src="/mosaic-preview.webp" alt="" />
              {spots.map((s, i) => (
                <i key={i} style={{ left: `${s.left}%`, top: `${s.top}%` }} />
              ))}
            </div>
            <span>Where she appears in the mosaic</span>
          </div>
        )}
      </div>
    </div>
  );
}
