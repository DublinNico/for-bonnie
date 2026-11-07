"use client";

import { useCallback, useState, type ReactNode } from "react";
import type { MosaicData } from "../lib/types";
import Gallery from "./Gallery";
import Lightbox from "./Lightbox";
import MosaicExplorer from "./MosaicExplorer";

/**
 * Owns the state shared by the explorer, gallery and lightbox:
 * which photo is open, and which photo is highlighted in the mosaic.
 * `between` is server-rendered content shown between the explorer and gallery.
 */
export default function MosaicExperience({ data, between }: { data: MosaicData; between?: ReactNode }) {
  const [open, setOpen] = useState<{ order: number[]; position: number } | null>(null);
  const [focus, setFocus] = useState<number | null>(null);

  const openFromMosaic = useCallback(
    (photoIndex: number) => {
      const order = data.photos.map((_, i) => i);
      setOpen({ order, position: photoIndex });
    },
    [data.photos],
  );

  const openFromGallery = useCallback((photoIndex: number, order: number[]) => {
    setOpen({ order, position: order.indexOf(photoIndex) });
  }, []);

  const showInMosaic = useCallback((photoIndex: number) => {
    setOpen(null);
    setFocus(photoIndex);
    document.getElementById("mosaic")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <>
      <MosaicExplorer
        data={data}
        focusPhoto={focus}
        onClearFocus={() => setFocus(null)}
        onOpenPhoto={openFromMosaic}
      />
      {between}
      <Gallery photos={data.photos} onOpen={openFromGallery} />
      {open && (
        <Lightbox
          data={data}
          order={open.order}
          position={open.position}
          onNavigate={(position) => setOpen({ ...open, position })}
          onClose={() => setOpen(null)}
          onShowInMosaic={showInMosaic}
        />
      )}
    </>
  );
}
