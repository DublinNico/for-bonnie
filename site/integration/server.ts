// Starts the site's production build inside the test process (Next.js "custom server"
// mode, see node_modules/next/dist/docs/01-app/02-guides/custom-server.md).
// Supertest takes the returned http.Server and sends requests to it directly —
// no port to manage, no browser, no network.
import { createServer, type Server } from "node:http";
import next from "next";

export async function startSite(): Promise<Server> {
  const app = next({ dev: false, dir: process.cwd() }); // dev: false = the `npm run build` output
  await app.prepare();
  const handle = app.getRequestHandler();
  return createServer((req, res) => handle(req, res));
}
