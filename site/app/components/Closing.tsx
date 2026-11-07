/* eslint-disable @next/next/no-img-element -- pre-sized static assets */

// Left to right. Each card gets a slight tilt (degrees) and drop (px) so the row
// reads as a gentle arc of scattered polaroids, without any of them overlapping.
const POLAROIDS = [
  { id: "tile_322", rotate: -7, drop: 28 },
  { id: "tile_036", rotate: -3, drop: 8 },
  { id: "tile_290", rotate: 1, drop: 0 },
  { id: "tile_188", rotate: 4, drop: 8 },
  { id: "tile_045", rotate: 7, drop: 28 },
];

export default function Closing({ photoCount }: { photoCount: number }) {
  return (
    <footer className="closing" id="for-bonnie">
      <div className="polaroids" aria-hidden>
        {POLAROIDS.map(({ id, rotate, drop }) => (
          <div
            key={id}
            className="polaroid"
            style={{ "--rotate": `${rotate}deg`, "--drop": `${drop}px` } as React.CSSProperties}
          >
            <img src={`/tiles/sm/${id}.webp`} alt="" loading="lazy" />
          </div>
        ))}
      </div>

      <div className="closing-text">
        <p className="for">For Bonnie,</p>
        <h2>
          who gave us <span className="eleven">11</span> wonderful years we will never forget.
        </h2>
      </div>

      <div className="closing-foot">
        <span className="mark">Bonnie</span>
        <nav aria-label="Footer">
          <a href="#mosaic">Mosaic</a>·<a href="#gallery">Gallery</a>
        </nav>
        <span>Made from {photoCount} photographs, with love.</span>
      </div>
    </footer>
  );
}
