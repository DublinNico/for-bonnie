// Integration tests: Python output (public/) + Next.js production build + HTTP, together.
// The site has no API, database, login or forms, so "endpoints" are the URLs it serves.
import { createHash } from "node:crypto";
import fs from "node:fs";
import type { Server } from "node:http";
import path from "node:path";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { startSite } from "./server";

const PUBLIC = path.join(process.cwd(), "public");
const mosaicFile = fs.readFileSync(path.join(PUBLIC, "mosaic.json"));
const mosaic = JSON.parse(mosaicFile.toString()) as { cols: number; rows: number; grid: string[] };
const tileIds = fs.readdirSync(path.join(PUBLIC, "tiles", "sm")).filter((f) => f.endsWith(".webp"));
const sha = (data: Buffer | string) => createHash("sha256").update(data).digest("hex");
const FOREIGN = "https://evil.example";

let site: Server;
let html: string; // the home page, with React's <!-- --> text separators removed
beforeAll(async () => {
  site = await startSite();
  html = (await request(site).get("/")).text.replaceAll("<!-- -->", "");
});

describe("the page /", () => {
  it("IT-001 GET / returns the page", async () => {
    const res = await request(site).get("/");
    expect(res.status).toBe(200);
    expect(res.type).toBe("text/html");
    expect(html).toContain("<title>Bonnie</title>");
  });

  it("IT-002 the page shows every photo and the counts match the data files", () => {
    expect(html.match(/class="gallery-item"/g)).toHaveLength(tileIds.length);
    expect(html).toContain(`A photomosaic · ${tileIds.length} photographs`);
    expect(html).toContain(`${mosaic.cols} × ${mosaic.rows} squares`);
  });

  it("IT-003 HEAD / answers without a body", async () => {
    const res = await request(site).head("/");
    expect(res.status).toBe(200);
    expect(res.text ?? "").toBe("");
  });

  it("IT-004 every image the page uses loads, as an image", async () => {
    const srcs = [...new Set([...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]))];
    expect(srcs.length).toBeGreaterThan(tileIds.length);
    for (const src of srcs) {
      const res = await request(site).head(src);
      expect(res.status, src).toBe(200);
      expect(res.headers["content-type"], src).toMatch(/^image\//);
    }
  });

  it("IT-005 the icons in the page head load with the right types", async () => {
    const links = [...html.matchAll(/<link rel="(icon|apple-touch-icon)" href="([^"]+)"[^>]*type="([^"]+)"/g)];
    expect(links).toHaveLength(3);
    for (const [, , href, type] of links) {
      const res = await request(site).get(href);
      expect(res.status, href).toBe(200);
      expect(res.headers["content-type"]).toBe(type);
    }
  });

  it("IT-006 scripts and styles load and are cached long-term", async () => {
    const assets = [...new Set([...html.matchAll(/"(\/_next\/static\/[^"]+\.(?:js|css))"/g)].map((m) => m[1]))];
    expect(assets.length).toBeGreaterThan(0);
    for (const asset of assets) {
      const res = await request(site).head(asset);
      expect(res.status, asset).toBe(200);
      expect(res.headers["cache-control"], asset).toContain("immutable");
    }
  });

  it("IT-007 the page has no forms that could submit data", () => {
    expect(html).not.toContain("<form");
    expect([...html.matchAll(/<input[^>]*type="([^"]+)"/g)].map((m) => m[1])).toEqual(["range"]);
  });
});

describe("the data /mosaic.json", () => {
  it("IT-008 GET /mosaic.json returns exactly the file bonnie.py wrote", async () => {
    const res = await request(site).get("/mosaic.json").buffer(true);
    expect(res.status).toBe(200);
    expect(res.type).toBe("application/json");
    expect(sha(res.text)).toBe(sha(mosaicFile)); // raw text: Supertest also parses JSON into res.body
    expect(mosaic.grid).toHaveLength(mosaic.cols * mosaic.rows);
  });

  it("IT-009 every photo in the layout is served at all three sizes, as WebP", async () => {
    for (const name of new Set(mosaic.grid)) {
      for (const size of ["xs", "sm", "lg"]) {
        const url = `/tiles/${size}/${name.replace(/\.[^.]+$/, "")}.webp`;
        const res = await request(site).head(url);
        expect(res.status, url).toBe(200);
        expect(res.headers["content-type"], url).toBe("image/webp");
      }
    }
  });
});

describe("bad requests (wrong values)", () => {
  it("IT-010 photos, sizes and extensions that don't exist are 404", async () => {
    for (const url of ["/tiles/sm/tile_999.webp", "/tiles/sm/tile_000.webp", "/tiles/huge/tile_001.webp", "/tiles/sm/tile_001.jpg"]) {
      expect((await request(site).get(url)).status, url).toBe(404);
    }
  });

  it("IT-011 path-traversal tricks can't reach files outside public/", async () => {
    for (const url of ["/tiles/sm/..%2f..%2fpackage.json", "/..%2fpackage.json", "/%2e%2e/%2e%2e/next.config.ts", "/_next/static/..%2f..%2fpackage.json"]) {
      const res = await request(site).get(url);
      expect(res.status, url).toBe(404);
      expect(res.text, url).not.toContain('"name": "site"');
    }
  });
});

describe("access control (no login exists: private files must never be served)", () => {
  it("IT-012 secrets, config and source code are not reachable", async () => {
    for (const url of ["/.env.local", "/.vercel/project.json", "/package.json", "/app/page.tsx", "/next.config.ts", "/tsconfig.json"]) {
      const res = await request(site).get(url);
      expect(res.status, url).toBe(404);
      expect(res.text, url).not.toMatch(/VERCEL_OIDC_TOKEN|projectId/);
    }
  });

  it("IT-013 PUT, DELETE and POST are refused and change nothing", async () => {
    for (const method of ["put", "delete", "post"] as const) {
      const res = await request(site)[method]("/mosaic.json").send("{}");
      expect(res.status, method).toBeGreaterThanOrEqual(400);
    }
    expect(sha(fs.readFileSync(path.join(PUBLIC, "mosaic.json")))).toBe(sha(mosaicFile));
  });

  it("IT-014 POST to the page accepts no data (405 from next start / Vercel; this in-process mode just returns the page)", async () => {
    const res = await request(site).post("/").send("x=1");
    expect([200, 405]).toContain(res.status);
  });

  it.fails("IT-015 [KNOWN ISSUE] write methods on files get a clean 405 locally (next start gives 500; live Vercel gives 405)", async () => {
    expect((await request(site).put("/mosaic.json")).status).toBe(405);
  });
});

describe("not found (404)", () => {
  it("IT-016 unknown pages return a real 404 page that search engines skip", async () => {
    const res = await request(site).get("/no-such-page");
    expect(res.status).toBe(404);
    expect(res.text).toContain("This page could not be found");
    expect(res.text).toMatch(/<meta name="robots" content="noindex"/);
  });

  it("IT-017 error responses leak no file paths or stack traces", async () => {
    for (const res of [await request(site).get("/no-such-page"), await request(site).delete("/mosaic.json")]) {
      expect(res.text).not.toMatch(/C:\\|node_modules|\/home\/|\s+at\s+\S+\s+\(/);
    }
  });
});

describe("CORS and headers", () => {
  it("IT-018 other websites get no CORS permission from the Next.js server", async () => {
    for (const url of ["/", "/mosaic.json"]) {
      const res = await request(site).get(url).set("Origin", FOREIGN);
      expect(res.headers["access-control-allow-origin"], url).toBeUndefined();
    }
  });

  it("IT-019 cross-origin preflight requests are not granted", async () => {
    const res = await request(site).options("/mosaic.json").set("Origin", FOREIGN).set("Access-Control-Request-Method", "PUT");
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.headers["access-control-allow-methods"]).toBeUndefined();
  });

  it("IT-020 the data file is revalidated so updates show up", async () => {
    expect((await request(site).get("/mosaic.json")).headers["cache-control"]).toContain("max-age=0");
  });

  it("IT-021 the server doesn't advertise its framework (no X-Powered-By)", async () => {
    expect((await request(site).get("/")).headers["x-powered-by"]).toBeUndefined();
  });

  it("IT-022 standard security headers are sent on the page, the data and the images", async () => {
    for (const url of ["/", "/mosaic.json", "/tiles/sm/tile_001.webp", "/no-such-page"]) {
      const headers = (await request(site).get(url)).headers;
      expect(headers["x-content-type-options"], url).toBe("nosniff");
      expect(headers["referrer-policy"], url).toBe("strict-origin-when-cross-origin");
      expect(headers["x-frame-options"], url).toBe("DENY");
      expect(headers["content-security-policy"], url).toBe("frame-ancestors 'none'");
      expect(headers["permissions-policy"], url).toBe("camera=(), microphone=(), geolocation=()");
    }
  });
});
