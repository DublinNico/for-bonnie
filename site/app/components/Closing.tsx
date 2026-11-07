/* eslint-disable @next/next/no-img-element -- pre-sized static assets */

// Rotation for each polaroid in the fan, outermost first so the centre one sits on top
const POLAROIDS = [
  { id: "tile_322", rotate: -24 },
  { id: "tile_036", rotate: -12 },
  { id: "tile_188", rotate: 12 },
  { id: "tile_045", rotate: 24 },
  { id: "tile_290", rotate: 0 },
];

export default function Closing({ photoCount }: { photoCount: number }) {
  return (
    <footer className="closing" id="for-bonnie">
      <div className="polaroids" aria-hidden>
        {POLAROIDS.map(({ id, rotate }) => (
          <div
            key={id}
            className="polaroid"
            style={{ transform: `rotate(${rotate}deg)`, top: rotate === 0 ? -10 : undefined }}
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
