// Security tests against the real production build (in-process, via Supertest).
// The site has no database, login, tokens or admin area — these tests prove that
// stays true, and that hostile input can't crash it, be reflected, or reach secrets.
import fs from "node:fs";
import type { Server } from "node:http";
import path from "node:path";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { startSite } from "../../integration/server";

let site: Server;
beforeAll(async () => {
  site = await startSite();
});

const INJECTION_PAYLOADS = [
  "' OR '1'='1' --", // SQL
  "1; DROP TABLE photos;--", // SQL
  '{"$ne": null}', // NoSQL (MongoDB operator)
  '{"$where": "sleep(5000)"}', // NoSQL (server-side JavaScript)
  "<script>alert(1)</script>", // reflected XSS
  '"><img src=x onerror=alert(1)>', // reflected XSS (attribute breakout)
  "${7*7}{{7*7}}", // template injection
  "../../../../etc/passwd", // path traversal
];

/** A response must never be a server error or contain a stack trace / file path. */
function expectNoLeak(res: request.Response, label: string) {
  expect(res.status, label).toBeLessThan(500);
  expect(res.text, label).not.toMatch(/C:\\|node_modules|\/home\/|\s+at\s+\S+\s+\(|SyntaxError|TypeError/);
}

describe("injection", () => {
  it("ST-001 SQL/NoSQL/template payloads in the query string don't crash or change the page", async () => {
    const normal = await request(site).get("/");
    for (const payload of INJECTION_PAYLOADS) {
      const res = await request(site).get("/").query({ id: payload, "q[$ne]": payload });
      expectNoLeak(res, payload);
      expect(res.status, payload).toBe(200);
      expect(res.text.length, payload).toBe(normal.text.length); // the same static page, unaffected
    }
  });

  it("ST-002 injection payloads in the URL path are a plain 404", async () => {
    for (const payload of INJECTION_PAYLOADS) {
      const res = await request(site).get(`/tiles/sm/${encodeURIComponent(payload)}`);
      expectNoLeak(res, payload);
      expect(res.status, payload).toBe(404);
    }
  });

  it("ST-003 script payloads sent to the site are never reflected back into a page", async () => {
    for (const payload of ["<script>alert(1)</script>", '"><img src=x onerror=alert(1)>']) {
      for (const res of [
        await request(site).get("/").query({ q: payload }),
        await request(site).get(`/${encodeURIComponent(payload)}`),
      ]) {
        expect(res.text, payload).not.toContain(payload);
        expect(res.text, payload).not.toContain("onerror=alert");
      }
    }
  });

  it("ST-004 injection payloads in a request body are refused, not processed", async () => {
    for (const payload of INJECTION_PAYLOADS) {
      const res = await request(site).post("/mosaic.json").set("Content-Type", "application/json").send(JSON.stringify({ id: payload }));
      expect(res.status, payload).toBeGreaterThanOrEqual(400);
      // Locally `next start` answers 500 here (tracked as IT-015; live Vercel answers 405),
      // so check the body reveals nothing rather than the exact status
      expect(res.text, payload).toBe("Internal Server Error");
    }
  });
});

describe("authentication, tokens and admin", () => {
  it("ST-005 there is no login, auth, admin or API endpoint to attack", async () => {
    for (const url of ["/login", "/admin", "/api", "/api/login", "/api/auth/signin", "/api/admin", "/wp-admin", "/graphql"]) {
      expect((await request(site).get(url)).status, url).toBe(404);
      expect((await request(site).post(url).send({ username: "admin", password: "x" })).status, url).toBeGreaterThanOrEqual(400);
    }
  });

  it("ST-006 the site never sets cookies, so there is no session or token to steal or tamper with", async () => {
    for (const url of ["/", "/mosaic.json", "/no-such-page", "/tiles/sm/tile_001.webp"]) {
      expect((await request(site).get(url)).headers["set-cookie"], url).toBeUndefined();
    }
  });

  it("ST-007 forged or tampered tokens unlock nothing: writes are still refused", async () => {
    const forged = [
      "eyJhbGciOiJub25lIn0.eyJyb2xlIjoiYWRtaW4ifQ.", // alg "none", role admin
      "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4ifQ.d3Jvbmctc2VjcmV0", // wrong secret
    ];
    for (const token of forged) {
      const res = await request(site).put("/mosaic.json").set("Authorization", `Bearer ${token}`).set("Cookie", `session=${token}`).send("{}");
      expect(res.status).toBeGreaterThanOrEqual(400);
    }
    const before = fs.readFileSync(path.join(process.cwd(), "public", "mosaic.json"), "utf8");
    expect((await request(site).get("/mosaic.json")).text).toBe(before);
  });

  it("ST-008 a burst of requests doesn't break the server (no login exists to rate-limit)", async () => {
    const results = await Promise.all(Array.from({ length: 50 }, () => request(site).get("/mosaic.json")));
    expect(results.every((res) => res.status === 200)).toBe(true);
  });
});

describe("secrets never reach the browser", () => {
  const nextDir = path.join(process.cwd(), ".next");
  /** Every file under `dir`, recursively — here, everything a browser can download. */
  const clientFiles = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? clientFiles(path.join(dir, e.name)) : [path.join(dir, e.name)]));

  /** Values from a .env file, read the way Next.js does: comments, `export`, spaces and quotes handled. */
  const envFileValues = (file: string): string[] =>
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const assignment = line.replace(/^export\s+/, "");
        const value = assignment.slice(assignment.indexOf("=") + 1).trim();
        const quoted = value.match(/^(['"`])([\s\S]*)\1$/);
        return quoted ? quoted[2] : value.replace(/\s+#.*$/, ""); // unquoted values can end in a comment
      });

  it("ST-009 no secret (from .env.local or named in SECRET_ENV_VARS) appears in any file the browser can download", () => {
    const envFile = path.join(process.cwd(), ".env.local");
    // Read the secret values only to search for them — never print them
    const fromFile = fs.existsSync(envFile) ? envFileValues(envFile) : [];
    // CI sets fake secrets and lists their names in SECRET_ENV_VARS (see ci.yml); only those are checked
    const fromEnv = (process.env.SECRET_ENV_VARS ?? "")
      .split(",")
      .map((name) => process.env[name.trim()] ?? "");
    const secrets = [...fromFile, ...fromEnv].filter((v) => v.length >= 16);
    const leaks = clientFiles(path.join(nextDir, "static")).filter((file) => {
      const text = fs.readFileSync(file, "latin1");
      return text.includes("VERCEL_OIDC_TOKEN") || secrets.some((secret) => text.includes(secret));
    });
    expect(leaks.map((f) => path.relative(nextDir, f))).toEqual([]);
  });

  it("ST-010 source maps (readable original source) are not published", async () => {
    const maps = clientFiles(path.join(nextDir, "static")).filter((f) => f.endsWith(".map"));
    expect(maps).toEqual([]);
    const script = (await request(site).get("/")).text.match(/\/_next\/static\/[^"]+\.js/)![0];
    expect((await request(site).get(`${script}.map`)).status).toBe(404);
  });

  it("ST-011 the page links nowhere outside the site (nothing to hijack via target=_blank)", async () => {
    const html = (await request(site).get("/")).text;
    const hrefs = [...html.matchAll(/<a[^>]+href="([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs.length).toBeGreaterThan(0);
    expect(hrefs.filter((href) => /^(https?:)?\/\//.test(href))).toEqual([]);
  });

  it("ST-012 hidden server files stay hidden, whatever the spelling", async () => {
    for (const url of ["/.env.local", "/.ENV.LOCAL", "/.env", "/%2eenv.local", "/.git/config", "/.vercel/project.json", "/next.config.ts"]) {
      const res = await request(site).get(url);
      expect(res.status, url).toBe(404);
      expect(res.text, url).not.toMatch(/OIDC|projectId|\[core\]/);
    }
  });
});
