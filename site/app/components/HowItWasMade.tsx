/* eslint-disable @next/next/no-img-element -- pre-sized static assets */

export default function HowItWasMade({ cols, rows, photoCount }: { cols: number; rows: number; photoCount: number }) {
  return (
    <section className="how" aria-labelledby="how-title">
      <div className="how-intro">
        <span className="label">How it was made</span>
        <h2 id="how-title">One photo, made of all the others.</h2>
        <p>
          We took a favourite picture of Bonnie, split it into a grid, and filled each square with whichever of our
          photos matched its colour best — never letting the same one sit too close to itself.
        </p>
        <p className="note">
          {cols} × {rows} · {(cols * rows).toLocaleString()} squares · {photoCount} photos
        </p>
      </div>

      <ol className="how-steps">
        <li className="how-step">
          <div className="img">
            <img src="/portrait.webp" alt="The original photo of Bonnie" loading="lazy" />
          </div>
          <div className="n">i.</div>
          <h3>The portrait</h3>
          <p>One photo we all agreed was her.</p>
        </li>
        <li className="how-step">
          <div className="img">
            <img
              src="/grid.png"
              alt="The same photo reduced to one colour per square"
              className="pixelated"
              loading="lazy"
            />
          </div>
          <div className="n">ii.</div>
          <h3>The grid</h3>
          <p>Each square reduced to a single colour.</p>
        </li>
        <li className="how-step">
          <div className="img">
            <img src="/mosaic-preview.webp" alt="The finished mosaic" loading="lazy" />
          </div>
          <div className="n">iii.</div>
          <h3>The mosaic</h3>
          <p>Every colour swapped for a memory.</p>
        </li>
      </ol>
    </section>
  );
}
