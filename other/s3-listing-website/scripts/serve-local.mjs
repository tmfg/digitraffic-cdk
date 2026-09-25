#!/usr/bin/env node
// Serves the shared listing engine locally for manual preview, with a project's own config
// injected the same way `createListingWebsiteSources()` generates it for a real deployment.
//
// Usage: node scripts/serve-local.mjs --config <path-to-config.json> [--port 8080]

import { createReadStream, existsSync, readFileSync, watch } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const configIndex = args.indexOf("--config");
if (configIndex === -1 || !args[configIndex + 1]) {
  console.error(
    "Usage: serve-local.mjs --config <path-to-config.json> [--port 8080]",
  );
  process.exit(1);
}

const portIndex = args.indexOf("--port");
const port = portIndex !== -1 ? args[portIndex + 1] : "8080";

const configPath = path.resolve(args[configIndex + 1]);

const engineDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "engine",
);

const liveReloadSnippet = `
<script>
  (() => {
    const events = new EventSource("/__live-reload");
    events.addEventListener("change", () => window.location.reload());
  })();
</script>`;

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
]);

const liveReloadClients = new Set();
let reloadTimer;

function readConfig() {
  return JSON.parse(readFileSync(configPath, "utf8"));
}

function sendLiveReload() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    for (const client of liveReloadClients) {
      client.write("event: change\ndata: reload\n\n");
    }
  }, 50);
}

function send(response, statusCode, body, contentType = "text/plain") {
  response.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-type": contentType,
  });
  response.end(body);
}

function serveIndex(response) {
  const html = readFileSync(path.join(engineDir, "index.html"), "utf8").replace(
    "</body>",
    `${liveReloadSnippet}\n  </body>`,
  );
  send(response, 200, html, "text/html; charset=utf-8");
}

function serveConfig(response) {
  send(
    response,
    200,
    `window.LISTING_CONFIG = ${JSON.stringify(readConfig(), null, 2)};\n`,
    "text/javascript; charset=utf-8",
  );
}

function serveAsset(requestPath, response) {
  const relativePath = requestPath.replace(/^\/+/, "");
  const filePath = path.resolve(engineDir, relativePath);
  if (!filePath.startsWith(`${engineDir}${path.sep}`)) {
    send(response, 403, "Forbidden");
    return;
  }
  if (!existsSync(filePath)) {
    send(response, 404, "Not found");
    return;
  }

  const contentType =
    contentTypes.get(path.extname(filePath)) ?? "application/octet-stream";
  response.writeHead(200, {
    "cache-control": "no-store",
    "content-type": contentType,
  });
  createReadStream(filePath).pipe(response);
}

function serveLiveReload(response) {
  response.writeHead(200, {
    "cache-control": "no-store",
    connection: "keep-alive",
    "content-type": "text/event-stream",
  });
  response.write("event: ready\ndata: connected\n\n");
  liveReloadClients.add(response);
  response.on("close", () => liveReloadClients.delete(response));
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://localhost:${port}`);
  const requestPath = decodeURIComponent(url.pathname);

  if (requestPath === "/__live-reload") {
    serveLiveReload(response);
  } else if (requestPath === "/" || requestPath === "/index.html") {
    serveIndex(response);
  } else if (requestPath === "/assets/config.js") {
    serveConfig(response);
  } else if (requestPath.startsWith("/assets/")) {
    serveAsset(requestPath, response);
  } else {
    send(response, 404, "Not found");
  }
});

function watchForLiveReload() {
  try {
    watch(engineDir, { recursive: true }, sendLiveReload);
  } catch (error) {
    if (error.code !== "ERR_FEATURE_UNAVAILABLE_ON_PLATFORM") {
      throw error;
    }
    watch(engineDir, sendLiveReload);
    watch(path.join(engineDir, "assets"), sendLiveReload);
  }
  watch(configPath, sendLiveReload);
}

watchForLiveReload();

server.listen(Number(port), () => {
  console.log(`Serving preview from ${engineDir}`);
  console.log(
    `\n👉 Mock listing: http://localhost:${port}/?mock=1 (add &lang=en for English)\n`,
  );
});
