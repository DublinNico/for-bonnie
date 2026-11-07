import Closing from "./components/Closing";
import Hero from "./components/Hero";
import HowItWasMade from "./components/HowItWasMade";
import MosaicExperience from "./components/MosaicExperience";
import { loadMosaic } from "./lib/load-mosaic";

export default function Home() {
  const mosaic = loadMosaic();
  const photoCount = mosaic.photos.length;

  return (
    <>
      <Hero photoCount={photoCount} />
      <main>
        {/* Explorer, then "how it was made" (server-rendered), then gallery */}
        <MosaicExperience
          data={mosaic}
          between={<HowItWasMade cols={mosaic.cols} rows={mosaic.rows} photoCount={photoCount} />}
        />
      </main>
      <Closing photoCount={photoCount} />
    </>
  );
}
