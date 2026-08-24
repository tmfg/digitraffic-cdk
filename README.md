# Digitraffic-common

This is a place for common utilities and classes that can be used in other cdk-projects.

## Setup

Initialize the project scripts by running the following command. This only needs to be done once, after cloning or
pulling the repository for the first time. It will install/reinstall lefthook git hooks.

```shell
pnpm run setup
```

After that approve esbuild:

```shell
pnpm approve-builds
```

And then run again the setup.

## How to build

Use `pnpm` to build the code i.e.

    pnpm install
    pnpm run build
    pnpm run test
    pnpm run test --test-path-pattern 'dt-logger.test'
    pnpm run test:watch
    pnpm run test:watch --test-path-pattern 'dt-logger.test'

Format code

    pnpm run format:package-json # Format package.json
    pnpm run format:check # Checks all files
    pnpm run format:check-staged # Checks stagged files
    pnpm run format:fix # Format all files
    pnpm run format:fix-staged # Formats stagged files

## Update deps

This project uses exact dependency versions (no semver ranges)
and has a 7-day cooldown defined in [.npmrc](.npmrc).

### Full update workflow

1. **Update all dependencies** (deps, peerDeps, and Node version in `.npmrc`):
   ```bash
   pnpm deps:update-all
   ```
   This updates `package.json`, `pnpm-lock.yaml`, and installs everything in one step — no separate `pnpm install`
   needed. What `pnpm deps:update-all` does:
    - Runs `pnpm up --latest` for all packages **except** those listed in
      `pnpm.updateConfig.ignoredPackages` in `package.json` (e.g. `typescript`, `@types/node`)
    - Updates all `peerDependencies` to latest (same exclusions apply)
    - Updates `.npmrc` `use-node-version` to the newest Node release that is older than `minimum-release-age` and
      matches `engines.node`

   See `scripts/update-deps-and-peers.ts` for implementation details.

   Also **update `packageManager` manually** — it is not touched by the script.
   Check the latest pnpm 10.x version (older than 7 days) at
   https://www.npmjs.com/package/pnpm?activeTab=versions and update `package.json`:
   ```json
   "packageManager": "pnpm@10.x.x"
   ```
   See [DEPENDENCY_OVERRIDES.md](./DEPENDENCY_OVERRIDES.md#4-pnpm-version-packagemanager-field) for details.

2. **Check for vulnerabilities:**
   ```bash
   pnpm audit
   ```
   If vulnerabilities are reported in transitive dependencies, add or update overrides in
   `package.json` and/or exclusions in `.npmrc`.

3. **Check if existing overrides can be removed** — existing overrides may no longer be needed if upstream dependencies
   now pull in a safe version. Test each override by temporarily removing it, reinstalling, and re-running `pnpm audit`:
   ```bash
   # Remove the override from package.json, then do a fresh resolution:
   rm -rf node_modules pnpm-lock.yaml && pnpm install
   pnpm audit
   ```
   If no vulnerabilities are reported, the override is no longer needed — keep it removed. If vulnerabilities reappear,
   restore the override. See [DEPENDENCY_OVERRIDES.md](./DEPENDENCY_OVERRIDES.md) for details.

4. **Build and test:**
   ```bash
   pnpm run build
   pnpm run test
   ```

5. **Commit and open a pull request**

   Do the work on a feature branch so changes can be reviewed before merging.

6. **Publish a new version** — once the pull request is merged to master, publish so
   downstream projects pick up the changes (especially important for security fixes):
   ```bash
   ./scripts/publish.sh
   ```
   See [Publishing to npmjs.com](#publishing-to-npmjscom) below for details.

See [DEPENDENCY_OVERRIDES.md](./DEPENDENCY_OVERRIDES.md) for detailed instructions on adding, updating, and removing
overrides and `.npmrc` exclusions.

## Publishing to [npmjs.com](https://www.npmjs.com/)

See https://www.npmjs.com/package/@digitraffic/common

To publish using today's date as the version number:

```bash
./scripts/publish.sh
```

To publish with a specific version number:

```bash
./scripts/publish.sh 2026.8.6-1
```

## How to use

In package.json dependencies:

```
"dependencies": {
  "@digitraffic/common": "*",
}
```

In code:

```
import {DigitrafficStack, StackConfiguration} from "@digitraffic/common/dist/aws/infra/stack/stack";
```

### DigitrafficStack

If you extend your stack from DigitrafficStack you get many benefits:

- Secret, VPC, Sg & alarmTopics automatically
- Stack validation with StackCheckingAspect
- Easier configuration with StackConfiguration

If you do not need those things, you should not use DigitrafficStack.

### StackConfiguration

Commonly used parameters are predefined in `StackConfiguration`. Write the configuration for your environments once and reuse it across cdk-projects.

### StackCheckingAspect

Uses cdk aspects to do some sanity checking for your cdk stack:

- Stack naming check (Test/Prod in name)
- Function configuration (memory, timeout, runtime, reservedConcurrency)
- Tags, must have Solution tag defined
- S3 Buckets, no public access
- Api Gateway resource casing (kebabCase and snake_case)
- Queue encrypting
- LogGroup Retention

You can use StackCheckingAspect for any stack, DigitrafficStack does it automatically, but you can call it manually:

```
Aspects.of(this).add(StackCheckingAspect.create(this));
```

Any resource can be whitelisted by giving it as a parameter or in the StackConfiguration

### FunctionBuilder

FunctionBuilder allows you to make lambdas with alarms on memory usage and timeouts.

By default, the created function has access to database, but this can of course be controlled.

Creating lambda is easy:

```
const lambda = FunctionBuilder.create(stack, "get-metadata")
  .withTimeout(Duration.seconds(2))
  .build();
```

See the documentation for more information.
