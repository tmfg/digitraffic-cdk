#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

/**
 * Updates dependency versions in two phases:
 * 1) Update direct dependencies/devDependencies/optionalDependencies to latest.
 * 2) Update all existing peerDependencies to latest and keep them in peerDependencies.
 * 3) Update `.npmrc` `use-node-version` to the newest Node release that is older
 *    than `minimum-release-age` and matches `engines.node`.
 *
 * This script is executed via Node's TypeScript type-stripping mode:
 * `node --experimental-strip-types scripts/update-deps-and-peers.ts`
 */

type PackageJson = {
  engines?: {
    node?: string;
  };
  peerDependencies?: Record<string, string>;
};

type NodeRelease = {
  date: string;
  version: string;
};

/** Runs a pnpm command and exits immediately on failure. */
const run = (args: readonly string[]): void => {
  const result = spawnSync("pnpm", args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const compareVersions = (a: string, b: string): number => {
  const aParts = a.split(".").map((part) => Number(part));
  const bParts = b.split(".").map((part) => Number(part));

  for (let i = 0; i < 3; i += 1) {
    const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
};

const parseNodeEngineRange = (
  engineValue: string | undefined,
): { minMajor?: number; maxMajorExclusive?: number } => {
  if (!engineValue) {
    return {};
  }

  const minMatch = engineValue.match(/>=\s*(\d+)/);
  const maxMatch = engineValue.match(/<\s*(\d+)/);

  return {
    minMajor: minMatch ? Number(minMatch[1]) : undefined,
    maxMajorExclusive: maxMatch ? Number(maxMatch[1]) : undefined,
  };
};

const updateUseNodeVersionInNpmrc = async (
  packageJsonData: PackageJson,
): Promise<void> => {
  const npmrcPath = new URL("../.npmrc", import.meta.url);
  const npmrcText = readFileSync(npmrcPath, "utf8");
  const npmrcLines = npmrcText.split(/\r?\n/);

  const minimumReleaseAgeLine = npmrcLines.find((line) =>
    line.startsWith("minimum-release-age="),
  );
  const minimumReleaseAgeMinutes = Number(
    minimumReleaseAgeLine?.split("=")[1] ?? "0",
  );

  const { minMajor, maxMajorExclusive } = parseNodeEngineRange(
    packageJsonData.engines?.node,
  );

  const response = await fetch("https://nodejs.org/dist/index.json");
  if (!response.ok) {
    throw new Error(`Failed to fetch Node release index: ${response.status}`);
  }

  const releases = (await response.json()) as NodeRelease[];
  const cooldownMs = minimumReleaseAgeMinutes * 60 * 1000;
  const cutoffTime = Date.now() - cooldownMs;

  const candidates = releases
    .map((release) => {
      const version = release.version.startsWith("v")
        ? release.version.slice(1)
        : release.version;

      return {
        ...release,
        version,
      };
    })
    .filter((release) => {
      const publishedAt = Date.parse(`${release.date}T00:00:00Z`);
      if (!Number.isFinite(publishedAt) || publishedAt > cutoffTime) {
        return false;
      }

      const major = Number(release.version.split(".")[0]);
      if (Number.isNaN(major)) {
        return false;
      }

      if (minMajor !== undefined && major < minMajor) {
        return false;
      }

      return !(maxMajorExclusive !== undefined && major >= maxMajorExclusive);
    })
    .sort((a, b) => compareVersions(a.version, b.version));

  const latestAllowed = candidates.at(-1)?.version;
  if (!latestAllowed) {
    console.log(
      "No Node release matched minimum-release-age and engines.node constraints. Skipping use-node-version update.",
    );
    return;
  }

  const useNodeVersionPrefix = "use-node-version=";
  const useNodeVersionLineIndex = npmrcLines.findIndex((line) =>
    line.startsWith(useNodeVersionPrefix),
  );
  const nextLine = `${useNodeVersionPrefix}${latestAllowed}`;

  if (useNodeVersionLineIndex >= 0) {
    const current = npmrcLines[useNodeVersionLineIndex];
    if (current === nextLine) {
      console.log(`use-node-version is already up to date (${latestAllowed}).`);
      return;
    }

    npmrcLines[useNodeVersionLineIndex] = nextLine;
  } else {
    npmrcLines.push(nextLine);
  }

  const normalized = `${npmrcLines.filter((line, index, arr) => !(index === arr.length - 1 && line === "")).join("\n")}\n`;
  writeFileSync(npmrcPath, normalized, "utf8");

  console.log(`Updated use-node-version to ${latestAllowed}.`);
};

// Step 1: Update normal dependency blocks to the newest versions.
run(["up", "--latest"]);

const packageJsonText = readFileSync(
  new URL("../package.json", import.meta.url),
  "utf8",
);
const packageJson = JSON.parse(packageJsonText) as PackageJson;
const peerDependencyNames = Object.keys(packageJson.peerDependencies ?? {});

if (peerDependencyNames.length === 0) {
  console.log("No peerDependencies found. Done.");
  process.exit(0);
}

// Step 2: Update peerDependencies explicitly and keep exact versions.
const peerPackagesAtLatest = peerDependencyNames.map(
  (name) => `${name}@latest`,
);
run(["add", "--save-peer", "--save-exact", ...peerPackagesAtLatest]);

// Step 3: Keep .npmrc use-node-version up to date using the same cooldown window.
await updateUseNodeVersionInNpmrc(packageJson);
