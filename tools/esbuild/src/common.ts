import { writeFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { cyclonedxEsbuildPlugin } from "@cyclonedx/cyclonedx-esbuild";
import type { BuildOptions, BuildResult } from "esbuild";
import { globby } from "globby";

const distLambda = "dist/lambda";

const commonjsRequireBanner = `
import {createRequire} from 'module'
const require = createRequire(import.meta.url)
`;
const DEFAULT_BANNED_DEPENDENCY_LIB_PREFIXES = [
  "@aws-sdk/",
  "aws-sdk",
  "aws-lambda",
  "aws-cdk-lib",
  "pg-native",
];

const DEFAULT_LAMBDA_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB uncompressed

export async function createEsbuildConfig(): Promise<BuildOptions> {
  const lambdas = await globby("src/lambda/**/*.ts");

  if (!lambdas[0]) {
    throw new Error(`No lambdas specified`);
  }

  const outdir =
    lambdas.length === 1
      ? `${distLambda}/${basename(lambdas[0]).slice(0, -3)}`
      : distLambda;

  console.log(`Lambdas (${lambdas.length}):\n${lambdas.join("\n")}\n`);
  console.log(`Esbuild outdir: ${outdir}\n`);

  const outputFile =
    lambdas.length === 1 ? "../../../sbom.json" : "../../sbom.json";

  return {
    entryPoints: lambdas,
    logLevel: "warning",
    bundle: true,
    platform: "node",
    outdir,
    target: ["node24", "es2024"],
    external: ["@aws-sdk/*", "pg-native"],
    sourcemap: true,
    metafile: true,
    format: "esm",
    outExtension: { ".js": ".mjs" },
    banner: { js: commonjsRequireBanner },
    plugins: [
      cyclonedxEsbuildPlugin({
        specVersion: "1.6",
        outputFile,
      }),
    ],
  };
}

/**
 * Saves esbuild build result metadata to meta.json files alongside each output,
 * and performs analysis on dependencies and bundle sizes.
 * @param result
 * @param overides
 * e.g. for <code>afir/charging-network/src/lambda/api/charging-network/v1/locations/datex2-36/datex2-36.ts</code>
 *  {
 *    lambdaSizeOverrides: { "api/charging-network/v1/locations/datex2-36/datex2-36": 10 * 1024 * 1024 },
 *    whitelistedLibDependencyPrefixes: ["@aws-sdk/client-s3"]
 *  }
 */
export async function saveMetadataAndAnalyze(
  result: BuildResult,
  overides?: {
    lambdaSizeOverrides?: Record<string, number>;
    whitelistedLibDependencyPrefixes?: string[];
  },
) {
  if (!result.metafile) {
    throw new Error(
      `No metafile available in build result: ${JSON.stringify(result)}`,
    );
  }

  for (const [output, data] of Object.entries(result.metafile.outputs)) {
    const dir = dirname(output);
    await writeFile(
      `${dir}/meta.json`,
      JSON.stringify({
        inputs: result.metafile.inputs,
        outputs: {
          [output]: data,
        },
      }),
    );
  }

  analyzeMetadata(result, overides?.whitelistedLibDependencyPrefixes);
  analyzeBundleSizes(result, overides?.lambdaSizeOverrides);
}

/**
 * Analyzes an esbuild build result metafile for forbidden runtime dependencies.
 *
 * This function iterates over all input files recorded in `result.metafile.inputs`
 * and checks whether any file belongs to a package that matches a banned prefix
 * from `DEFAULT_POLICY`. If a match is found and the package is not in the optional
 * whitelist, the function throws an error, including the offending package name
 * and the specific input file path.
 *
 * Only files that are actually included in the bundle (`meta.bytes > 0`) are checked.
 * Type-only or unused files are ignored automatically.
 *
 * @param result - The esbuild BuildResult object, which must include a `metafile`.
 * @param whitelist - Optional array of package name prefixes that should be ignored.
 *                    Packages matching any prefix in the whitelist are allowed,
 *                    even if they also match a banned prefix in DEFAULT_POLICY.
 *
 * @throws Error if:
 *   - `result.metafile` is missing
 *   - A forbidden package is detected outside the whitelist
 */
export function analyzeMetadata(result: BuildResult, whitelist?: string[]) {
  if (!result.metafile) {
    throw new Error(
      `No metafile available in build result: ${JSON.stringify(result)}`,
    );
  }

  // Track which whitelist packages are actually found
  const foundWhitelist = new Set<string>();
  const errors: string[] = [];

  // Iterate per Lambda bundle (output)
  for (const [output, outputMeta] of Object.entries(result.metafile.outputs)) {
    // Only JS outputs
    if (!output.endsWith(".mjs") && !output.endsWith(".js")) continue;

    for (const [input, inputMeta] of Object.entries(outputMeta.inputs)) {
      // Skip inputs that are not actually included in the bundle
      if (inputMeta.bytesInOutput === 0) continue;

      const pkg = extractPackageName(input);
      if (!pkg) continue;

      // Whitelist handling
      if (whitelist?.some((allowed) => pkg.startsWith(allowed))) {
        foundWhitelist.add(pkg);
        continue;
      }

      // Check against banned prefixes
      for (const bannedPrefix of DEFAULT_BANNED_DEPENDENCY_LIB_PREFIXES) {
        if (pkg.startsWith(bannedPrefix)) {
          errors.push(
            `Lambda ${output} bundles forbidden dependency: ${pkg} (from ${input})`,
          );
        }
      }
    }
  }

  // Fail if any whitelist package was not found
  if (whitelist) {
    const missing = whitelist.filter(
      (allowed) =>
        ![...foundWhitelist].some((found) => found.startsWith(allowed)),
    );
    if (missing.length > 0) {
      errors.push(
        `Whitelisted package(s) not found in any Lambda: ${missing.join(", ")}`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Dependency policy violations:\n${errors.join("\n")}`);
  }
}

/**
 * Extracts the lambda name from an esbuild output path.
 *
 * @param outputPath E.g. <code>dist/lambda/api/charging-network/v1/locations/datex2-36/datex2-36.mjs</code>
 * @returns The lambda path <code>api/charging-network/v1/locations/datex2-36/datex2-36</code>
 * If the outputPath does not start with the expected dist/lambda prefix,
 * it is returned unchanged.
 */
function getLambdaPathFromOutput(outputPath: string): string {
  if (!outputPath.startsWith(distLambda)) {
    return outputPath;
  }

  return outputPath
    .slice(distLambda.length + 1)
    .replace(/\.mjs$/, "")
    .replace(/\.js$/, "");
}

export function analyzeBundleSizes(
  result: BuildResult,
  lambdaSizeOverrides?: Record<string, number>,
) {
  if (!result.metafile) {
    throw new Error("No metafile available for size analysis");
  }

  const errors: string[] = [];

  console.log("Lambda bundle sizes:");
  for (const [output, meta] of Object.entries(result.metafile.outputs)) {
    // Only JS outputs
    if (!output.endsWith(".mjs") && !output.endsWith(".js")) {
      continue;
    }
    const lambdaPath = getLambdaPathFromOutput(output);

    const size = meta.bytes;
    const limit =
      lambdaSizeOverrides?.[lambdaPath] ?? DEFAULT_LAMBDA_MAX_SIZE_BYTES;
    console[size > limit ? "error" : "log"](
      `${lambdaPath} is \t\t${formatBytes(size)} (limit ${formatBytes(limit)})`,
    );
    if (size > limit) {
      errors.push(
        `${output} is ${formatBytes(size)} (limit ${formatBytes(limit)})`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Lambda bundle size limit exceeded:\n${errors.join("\n")}`);
  }
}

/**
 * Extracts the npm package name from an esbuild metafile input path.
 *
 * This utility is designed for use with esbuild's `metafile.inputs`, where
 * each key represents a resolved file path that may originate from:
 *
 *   - pnpm's virtual store layout:
 *     node_modules/.pnpm/<pkg>@<version>.../node_modules/<pkg>/...
 *
 *   - standard npm/yarn layouts:
 *     node_modules/<pkg>/...
 *     node_modules/@scope/<pkg>/...
 *
 * The function normalizes pnpm-encoded scoped package names (e.g. `@scope+name`)
 * back into their canonical form (`@scope/name`) and returns the fully scoped
 * package name when applicable.
 *
 * Examples:
 *   extractPackageName("node_modules/.pnpm/@aws-sdk+client-s3@3.470.0/node_modules/@aws-sdk/client-s3/index.js")
 *   // → "@aws-sdk/client-s3"
 *
 *   extractPackageName("node_modules/undici/lib/index.js")
 *   // → "undici"
 *
 * Returns `null` if the path does not correspond to a file inside `node_modules`.
 *
 * @param inputPath - A file path from `result.metafile.inputs`
 * @returns The extracted package name, or `null` if none could be determined
 */
function extractPackageName(inputPath: string): string | null {
  // pnpm layout
  const pnpmMatch = inputPath.match(
    /node_modules\/\.pnpm\/[^/]+\/node_modules\/(@[^/]+\/[^/]+|[^/]+)/,
  );
  if (pnpmMatch && (pnpmMatch?.length ?? 0 >= 2) && pnpmMatch[1]) {
    return pnpmMatch[1].replace(/\+/g, "/");
  }

  // npm / yarn layout
  const npmMatch = inputPath.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
  if (npmMatch && (npmMatch?.length ?? 0 >= 2) && npmMatch[1]) {
    return npmMatch[1];
  }

  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}
