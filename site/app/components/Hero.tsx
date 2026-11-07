export default function Hero({ photoCount }: { photoCount: number }) {
  return (
    <header className="hero">
      <nav className="nav" aria-label="Main">
        <a href="#top" className="nav-mark">
          Bonnie
        </a>
        <div className="nav-links">
          <a href="#mosaic">Mosaic</a>
          <a href="#gallery">Gallery</a>
          <a href="#for-bonnie">For Bonnie</a>
        </div>
      </nav>

      <div className="hero-rail" aria-hidden />
      <p className="hero-kicker label">A photomosaic · {photoCount} photographs</p>

      <h1 className="hero-title" id="top">
        <span className="bon">Bon</span>
        <span className="nie">nie</span>
      </h1>

      <div className="hero-panel">
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static asset */}
        <img
          src="/portrait.webp"
          alt="Bonnie sitting on a path in her harness, looking at the camera"
          fetchPriority="high"
        />
      </div>

      <span className="hero-side left" aria-hidden>
        A photomosaic
      </span>
      <span className="hero-side right" aria-hidden>
        {photoCount} photographs
      </span>

      <div className="hero-memory">
        <span className="label">In memory</span>
        <p>Eleven years, told in every photo we ever took of her.</p>
      </div>

      <div className="hero-cta">
        <a href="#mosaic" className="link-arrow">
          Explore the mosaic <span aria-hidden>↓</span>
        </a>
        <span className="meta">Zoom in — every square is a moment</span>
      </div>
    </header>
  );
}
