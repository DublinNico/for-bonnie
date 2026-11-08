// Runs the Artillery load tests against the production build on this PC.
//
//   npm run test:perf                 build, then run every scenario
//   npm run test:perf:page            just one (also :gallery, :soak, :bad) — needs `npm run build` first
//
// By default it starts `next start` on port 3300 and stops it afterwards. To test a
// different server (e.g. a Vercel *preview*), set PERF_TARGET=https://... — but don't
// load-test the live site casually: it uses real bandwidth on a shared host.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ARTILLERY = "artillery@2.0.34"; // pinned; run through npx so it isn't a project dependency
const PORT = 3300;
const SCENARIOS = ["page-load", "gallery", "soak", "bad-traffic"];
const NEEDS_PHOTO_NAMES = new Set(["gallery", "soak"]); // these pick random photos (processor.cjs)

const chosen = process.argv.slice(2).length ? process.argv.slice(2) : SCENARIOS;
for (const name of chosen) {
  if (!SCENARIOS.includes(name)) {
    console.error(`Unknown scenario "${name}". Choose from: ${SCENARIOS.join(", ")}`);
    process.exit(2);
  }
}

const target = process.env.PERF_TARGET ?? `http://localhost:${PORT}`;
const env = {
  ...process.env,
  ARTILLERY_DISABLE_TELEMETRY: "true", // don't send anonymous usage data to Artillery
};

/**
 * The photo names the target server actually has, from its own /mosaic.json — so the
 * scenarios request real photos whichever server is tested (and however they're numbered).
 */
async function photoNamesFrom(baseUrl) {
  const res = await fetch(new URL("/mosaic.json", baseUrl));
  if (!res.ok) throw new Error(`Couldn't read ${baseUrl}/mosaic.json (HTTP ${res.status}) to pick photos from`);
  const { grid } = await res.json();
  return [...new Set(grid.map((name) => name.replace(/\.[^.]+$/, "")))];
}

/** Run a command, streaming its output; resolves with its exit code. */
const run = (command, args) =>
  new Promise((resolve) => spawn(command, args, { stdio: "inherit", shell: true, env }).on("exit", (code) => resolve(code ?? 1)));

/** Poll the server until it answers (or give up after `seconds`). */
async function waitForServer(url, seconds = 60) {
  for (let i = 0; i < seconds; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server at ${url} didn't start within ${seconds}s`);
}

/** Stop the server this run started, including its child processes. */
function stopServer(server) {
  if (!server || server.exitCode !== null) return;
  if (process.platform === "win32") spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  else process.kill(-server.pid, "SIGTERM"); // the whole process group
}

let server;
if (!process.env.PERF_TARGET) {
  if (!fs.existsSync(path.join(".next", "BUILD_ID"))) {
    console.error("No production build found. Run `npm run build` first (or use `npm run test:perf`).");
    process.exit(2);
  }
  server = spawn("npx", ["next", "start", "-p", String(PORT)], { shell: true, stdio: "ignore", detached: process.platform !== "win32", env });
}

const failed = [];
try {
  // Inside try, so the server is stopped even if it never becomes ready
  if (server) await waitForServer(target);
  if (chosen.some((name) => NEEDS_PHOTO_NAMES.has(name))) {
    env.PERF_PHOTOS = (await photoNamesFrom(target)).join(",");
  }
  for (const name of chosen) {
    console.log(`\n=== ${name} -> ${target} ===`);
    const code = await run("npx", ["--yes", ARTILLERY, "run", "--target", target, path.join("performance", `${name}.yml`)]);
    if (code !== 0) failed.push(name);
  }
} finally {
  stopServer(server);
}

console.log(`\nLoad tests: ${chosen.length - failed.length}/${chosen.length} passed${failed.length ? ` — FAILED: ${failed.join(", ")}` : ""}`);
process.exit(failed.length ? 1 : 0);
