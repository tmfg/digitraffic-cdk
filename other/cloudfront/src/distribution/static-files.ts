import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Root of the static file content, resolves to `<project>/static` from both
 * `src/distribution` and the compiled `lib/distribution`.
 */
export const STATIC_ROOT = fileURLToPath(
  new URL("../../static", import.meta.url),
);

/**
 * Returns the existing source directories for the given site, in deployment
 * order: `static/common` first, then the site-specific `static/<site>`
 * directory so that site files override common ones.
 */
export function staticSiteDirs(site: string): string[] {
  if (!/^[a-z0-9-]+$/.test(site)) {
    throw new Error(`Invalid static site name: ${site}`);
  }

  return [join(STATIC_ROOT, "common"), join(STATIC_ROOT, site)].filter((dir) =>
    existsSync(dir),
  );
}

/**
 * Lists the merged set of static file names for the given site
 * (union of `static/common` and `static/<site>` contents).
 */
export function listStaticFiles(site: string): string[] {
  const files = new Set<string>();

  for (const dir of staticSiteDirs(site)) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isFile()) {
        files.add(entry.name);
      }
    }
  }

  return [...files].sort();
}
