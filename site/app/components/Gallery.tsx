"use client";

/* eslint-disable @next/next/no-img-element -- pre-sized static assets */
import { useMemo, useState } from "react";
import { photoLabel, tileUrl, type Photo } from "../lib/types";

const SORTS = {
  number: { label: "In order", compare: (a: Photo, b: Photo) => a.number - b.number },
  most: { label: "Most used", compare: (a: Photo, b: Photo) => b.uses - a.uses || a.number - b.number },
  least: { label: "Least used", compare: (a: Photo, b: Photo) => a.uses - b.uses || a.number - b.number },
} as const;

type SortKey = keyof typeof SORTS;

type Props = {
  photos: Photo[];
  /** Called with the clicked photo's index and the current display order (for next/previous) */
  onOpen: (photoIndex: number, order: number[]) => void;
};

export default function Gallery({ photos, onOpen }: Props) {
  const [sort, setSort] = useState<SortKey>("number");

  const order = useMemo(
    () =>
      photos
        .map((photo, index) => ({ photo, index }))
        .sort((a, b) => SORTS[sort].compare(a.photo, b.photo))
        .map(({ index }) => index),
    [photos, sort],
  );

  const sortButtons = (Object.keys(SORTS) as SortKey[]).map((key) => (
    <button key={key} className="chip" aria-pressed={sort === key} onClick={() => setSort(key)}>
      {SORTS[key].label}
    </button>
  ));

  return (
    <section className="gallery" id="gallery" aria-labelledby="gallery-title">
      <div className="gallery-head">
        <div>
          <span className="label">Gallery</span>
          <h2 id="gallery-title">
            Every photo <em>in her.</em>
          </h2>
        </div>
        <div className="gallery-tools" role="group" aria-label="Sort photos">
          {sortButtons}
          <span className="count">{photos.length} photos</span>
        </div>
      </div>
      <div className="gallery-count">
        <span>{photos.length} photos</span>
        <span>Tap a photo to open it</span>
      </div>

      <div className="gallery-grid">
        {order.map((index) => {
          const photo = photos[index];
          return (
            <button key={photo.id} className="gallery-item" onClick={() => onOpen(index, order)}>
              <img src={tileUrl(photo, "sm")} alt={photoLabel(photo)} loading="lazy" decoding="async" />
              <span className="caption" aria-hidden>
                <b>{photoLabel(photo)}</b>
                {photo.uses > 0 ? `Used ${photo.uses}× in the mosaic` : "Not in the mosaic"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
