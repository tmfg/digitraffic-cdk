#!/usr/bin/env node
// Serves the shared listing engine locally for manual preview, with a project's own config
// injected the same way `createListingWebsiteSources()` generates it for a real deployment.
//
// Usage: node scripts/serve-local.mjs --config <path-to-config.json> [--port 8080]

import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

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
const config = JSON.parse(readFileSync(configPath, "utf8"));

const engineDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "engine",
);
const previewDir = mkdtempSync(
  path.join(tmpdir(), "s3-listing-website-preview-"),
);

cpSync(engineDir, previewDir, { recursive: true });
writeFileSync(
  path.join(previewDir, "assets", "config.js"),
  `window.LISTING_CONFIG = ${JSON.stringify(config, null, 2)};\n`,
);

console.log(`Serving preview from ${previewDir}`);
// Resolved from this package's own node_modules so it works regardless of which project's
// directory this script is invoked from, and stays updatable through the normal
// dependency-update process instead of always fetching a version via npx.
const serveBin = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "node_modules",
  ".bin",
  "serve",
);
const serveProcess = spawn(serveBin, [previewDir, "-l", port], {
  stdio: "inherit",
});
// "serve" prints its own "Serving!" box asynchronously; a short delay lets our reminder
// appear after it instead of being buried above it or interleaved mid-box.
setTimeout(() => {
  console.log(
    `\n👉 Mock listing: http://localhost:${port}/?mock=1 (add &lang=en for English)\n`,
  );
}, 500);
serveProcess.on("exit", (code) => process.exit(code ?? 0));
