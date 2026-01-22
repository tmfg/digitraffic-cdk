import { writeFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import type { BuildOptions, BuildResult } from "esbuild";
import { globby } from "globby";

const distLambda = "dist/lambda";

const commonjsRequireBanner = `
import {createRequire} from 'module'
const require = createRequire(import.meta.url)
`;

export async function createEsbuildConfig(): Promise<BuildOptions> {
  const lambdas = await globby("src/lambda/**/*.ts");

  if (!lambdas[0]) {
    throw new Error(`No lambdas specified`);
  }

  const outdir =
    lambdas.length === 1
      ? `${distLambda}/${basename(lambdas[0]).slice(0, -3)}`
      : distLambda;

  console.debug(`Lambdas (${lambdas.length}):\n${lambdas.join("\n")}`);
  console.debug(`esbuild outdir: ${outdir}`);

  return {
    entryPoints: lambdas,
    logLevel: "warning",
    bundle: true,
    platform: "node",
    outdir,
    target: ["node24", "es2024"],
    external: ["@aws-sdk/*", "aws-sdk", "pg-native"],
    sourcemap: true,
    metafile: true,
    format: "esm",
    outExtension: { ".js": ".mjs" },
    banner: { js: commonjsRequireBanner },
  };
}

export async function saveMetadata(result: BuildResult) {
  if (!result.metafile) {
    // console.info(
    //   `No metafile available to save result: ${JSON.stringify(result)}`,
    // );
    // return;
    throw new Error(
      `No metafile available in build result: ${JSON.stringify(result)}`,
    );
  }
  //console.debug(JSON.stringify(result));
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

  await analyzeMetadata(result);
}

const DEFAULT_POLICY = ["@aws-sdk/", "aws-sdk", "aws-cdk-lib", "pg-native"];

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
export async function analyzeMetadata(
  result: BuildResult,
  whitelist?: string[],
) {
  if (!result.metafile) {
    throw new Error(
      `No metafile available in build result: ${JSON.stringify(result)}`,
    );
  }

  // Track which whitelist packages are actually found
  const foundWhitelist = new Set<string>();

  for (const [input, meta] of Object.entries(result.metafile.inputs)) {
    // Ignore type-only or unused files
    if (meta.bytes === 0) {
      continue;
    }
    const pkg = extractPackageName(input);
    if (!pkg) continue;

    // Skip packages in whitelist
    if (whitelist?.some((allowed) => pkg.startsWith(allowed))) {
      console.warn("Whitelisted package:", pkg, "in", input);
      foundWhitelist.add(pkg);
      continue;
    }

    // Check against all banned prefixes
    for (const bannedPrefix of DEFAULT_POLICY) {
      if (pkg.startsWith(bannedPrefix)) {
        throw new Error(
          `Forbidden runtime dependency: ${pkg} found in ${input}`,
        );
      }
    }

    // Fail if any whitelist package was not found
    if (whitelist) {
      const missing = whitelist.filter(
        (allowed) =>
          ![...foundWhitelist].some((found) => found.startsWith(allowed)),
      );
      if (missing.length > 0) {
        throw new Error(
          `Whitelisted package(s) not found in any dependency: ${missing.join(
            ", ",
          )}`,
        );
      }
    }
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
