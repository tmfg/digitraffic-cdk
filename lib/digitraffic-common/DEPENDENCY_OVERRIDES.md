# Dependency Overrides and .npmrc Customizations

This project uses dependency overrides and `.npmrc` customizations to address security
vulnerabilities and ensure compatibility with certain packages.

> **See also:** [README.md](./README.md) for the full dependency update workflow.

---

## 1. Dependency Overrides in `package.json`

### Purpose
Overrides in the `pnpm.overrides` field of `package.json` force specific versions of
transitive dependencies, typically to patch vulnerabilities or work around bugs in packages
that are not direct dependencies.

These overrides use version range selectors to only affect vulnerable versions, leaving
already-safe versions unchanged.

### Current Overrides

- `@aws-sdk/core@>=3.977.3 <3.977.6` → `3.977.6`: Fix JSON document-number parsing bug (deprecated versions 3.977.3–3.977.5 pulled in by `@aws-sdk/client-*@3.1098.0`)
- `fast-uri@>=3.0.0 <3.1.5` → `3.1.5`: Fix host confusion via backslash authority introducer (GHSA-7p8r-x3mc-p8w7)
- `brace-expansion@>=4.0.0 <5.0.9` → `5.0.9`: Fix DoS via unbounded intermediate arrays, bypassing the CVE-2026-14257 mitigation (GHSA-rgw5-rvv9-x895)

### Adding a New Override

When `pnpm audit` reports a vulnerability in a transitive dependency:

1. Identify the vulnerable package and the safe version from the advisory.
2. Add a **range-scoped** override to `package.json` so only vulnerable versions are
   affected (do not pin all versions unconditionally):
   ```json
   "pnpm": {
     "overrides": {
       "some-package@<X.Y.Z": "X.Y.Z"
     }
   }
   ```
3. If the safe version was just released and is newer than the `minimum-release-age` (7 days),
   add a `minimum-release-age-exclude` entry to `.npmrc` (see section 2).
4. Reinstall and verify:
   ```bash
   rm -rf node_modules pnpm-lock.yaml && pnpm install
   pnpm audit
   ```
5. Document the override in the **Current Overrides** list above with the CVE/GHSA reference.

### Removing an Existing Override

An override can be removed when upstream direct dependencies have been updated to require
a safe transitive version on their own.

> ⚠️ Do **not** run `pnpm up --latest` as part of this check — that updates everything and
> masks whether the override itself was still needed. Use `pnpm install` to test with
> the existing dependency tree.

1. Remove the override entry from `package.json`.
2. Do a fresh resolution and audit — the lockfile was generated with the override in
   place (so it already has the safe version); keeping it would not reveal whether pnpm
   would still resolve to a vulnerable version on its own:
   ```bash
   rm -rf node_modules pnpm-lock.yaml && pnpm install
   pnpm audit
   ```
3. If no vulnerabilities are reported, the override is no longer needed — commit the removal.
4. If vulnerabilities reappear, restore the override.
5. Remove the entry from the **Current Overrides** list above.

---

## 2. `.npmrc` Customizations

### Purpose
The `.npmrc` file may include `minimum-release-age-exclude` entries to allow installation
of very recent package versions (e.g., security patches) before the default 7-day waiting
period elapses.

### Current Exclusions

- `fast-uri@3.1.5`: Published 2026-07-31, allowed before 7-day cooldown — needed for GHSA-7p8r-x3mc-p8w7 fix. Can be removed after 2026-08-07.
- `brace-expansion@5.0.9`: Published 2026-07-30, allowed before 7-day cooldown — needed for GHSA-rgw5-rvv9-x895 fix. Can be removed after 2026-08-06.
- `@aws-sdk/core@3.977.6`: Published 2026-08-04, allowed before 7-day cooldown — needed to replace deprecated `3.977.3`. Can be removed after 2026-08-11.

### Adding an Exclusion

When a security patch is released and needs to be used immediately (before the 7-day cooldown):

1. Add to `.npmrc` using the `[]=` array notation with a pinned version:
   ```
   minimum-release-age-exclude[]=package-name@X.Y.Z
   # for multiple packages, repeat the key:
   minimum-release-age-exclude[]=another-package@X.Y.Z
   ```
   > ⚠️ Always pin to the specific version (`package@X.Y.Z`), not just the package name.
   > Using just the name would bypass the cooldown for all future releases of that package.
   >
   > Do **not** use plain `minimum-release-age-exclude=a,b` or duplicate plain keys —
   > pnpm only respects the last assignment for plain keys (last-wins), and comma-separated
   > values are not split. Use `key[]=value` for each entry.
2. Run `pnpm install` to confirm installation succeeds.
3. Document the exclusion in **Current Exclusions** above, noting when it can be removed
   (i.e., once the version is older than 7 days).

### Removing an Exclusion

1. Check the release date of the package version — if it is now older than 7 days, the
   exclusion can be removed.
2. Delete the relevant line from `.npmrc`.
3. Run `pnpm install` to confirm the project still installs correctly.

---

## 3. Ignored Packages (`pnpm.updateConfig.ignoredPackages`)

### Purpose
Packages listed under `pnpm.updateConfig.ignoredPackages` serve two purposes:

1. **`pnpm up --latest` run directly** — pnpm natively skips these packages.
2. **`pnpm deps:update-all`** — the script (`scripts/update-deps-and-peers.ts`) reads
   `pnpm.updateConfig.ignoredPackages` from `package.json` and excludes them from both
   the `pnpm up` call and the peer-dependency update step. This makes `package.json` the
   single source of truth for both mechanisms.

### Current Ignored Packages

- **`typescript`** — TypeScript 7 is a complete rewrite: it dropped CJS support entirely
  (`"type": "module"`, no `main` field) and changed its entire public API. `@rushstack/heft`
  loads TypeScript via `require()` (CJS) and is incompatible with TypeScript 7 (causes a
  hard build failure: `Cannot find module .../typescript`). Validated working on `5.9.3`.
  Pinned at **`5.9.3`** until `@rushstack/heft-typescript-plugin` adds TypeScript 7 support.
  Track: https://github.com/microsoft/rushstack/issues

- **`@types/node`** — `engines.node` is `>=24 <25`, so `@types/node` must stay on `24.x`.
  Using `26.x` types exposes Node 26-only APIs to the TypeScript compiler, which could let
  Node 26-only code slip into the build while the published package still declares Node 24
  support. Pinned at **`24.13.3`** (latest 24.x). Update to a newer `24.x` patch when
  available; move to `25.x` only when `engines.node` is updated.

### How to Check If a Package Can Be Un-ignored

1. Check whether the blocking tooling (e.g., `@rushstack/heft-typescript-plugin`) has
   released a version with explicit support for the new major.
2. Temporarily remove the package from `ignoredPackages` and from `devDependencies` pinning,
   then run `pnpm deps:update-all`.
3. Run `pnpm run build && pnpm run test` — if both pass, remove the entry permanently
   and update this document.

---

## 4. pnpm Version (`packageManager` field)

### Purpose
The `packageManager` field pins the exact pnpm version used by the project. It is **not**
updated automatically by `pnpm deps:update-all` (the update script only touches
`dependencies`, `devDependencies`, and `peerDependencies`). It must be updated manually.

### Current Version

**`pnpm@10.34.5`** — Pinned to the **10.x major**. pnpm 11 introduced breaking changes
and is not yet validated for this project. Stay on the latest 10.x release until pnpm 11
compatibility has been confirmed.

### How to Update

1. Find the latest 10.x release:
   ```bash
   pnpm view pnpm versions --json | node -e \
     "const v=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(v.filter(x=>x.startsWith('10.')).at(-1))"
   ```
2. Update the `packageManager` field in `package.json` to `pnpm@<new-version>`.
3. Run `pnpm install` and `pnpm run build && pnpm run test` to confirm nothing broke.

### When to Move to pnpm 11

1. Review the pnpm 11 changelog for breaking changes: https://github.com/pnpm/pnpm/releases
2. Test by temporarily changing `packageManager` to the latest `11.x` version.
3. Run `pnpm install`, `pnpm run build`, `pnpm run test`, and `pnpm audit`.
4. If all pass, update `packageManager`, remove this note, and update this document.

---

## 5. General Guidance

- **Document every change:** When adding an override or exclusion, update the relevant
  section above with the CVE/GHSA reference and a brief reason.
- **Review regularly:** Overrides and exclusions should be reviewed as part of the routine
  dependency update workflow (see README.md).
- **Minimal scope:** Always use version range selectors for overrides (e.g., `pkg@<X.Y.Z`)
  rather than overriding all versions, to avoid masking future updates.

---

For further questions, contact the maintainers or refer to the pnpm documentation: https://pnpm.io/.
