# Repo scripts

Project contains cli-tools for usage in digitraffic mono repos.

Project workflow:

1. Create or edit cli tool in src/cli
2. Run `rushx publish:cdk` to bundle the tools and copy them to `common/scripts/`
3. Commit both the source changes and the updated bundles in `common/scripts/`

## Running cli tools

The esbuild bundles tools into a single file including all the dependencies.
Thus the cli can be invoked with `node tool.js` or if the tool has execution
permission, then it can be called directly `./tool.js`.

**NB** Node.js has to be installed in the target environment.

## Tools

### check-dependencies

Checks package.json dependencies. Run during git commit hook.

### unify-deps

Interactive tool for resolving mismatched dependency versions across the monorepo. Uses `rush check --json` to find version mismatches and prompts the user to pick the correct version for each conflict. Updates all affected `package.json` files.

Run via Rush custom command: `rush repo:unify-deps`
