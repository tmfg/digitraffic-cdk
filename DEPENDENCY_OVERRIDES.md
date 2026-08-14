# Dependency Overrides and .npmrc Customizations

This project uses Rush with pnpm workspaces. Dependency overrides and `.npmrc` customizations are configured
centrally in `common/config/rush/` to address security vulnerabilities and ensure compatibility.

## Configuration Files

| File                                                                         | Purpose                                                                    |
|------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| [`common/config/rush/pnpm-config.json`](common/config/rush/pnpm-config.json) | Contains `globalOverrides` to force specific dependency versions           |
| [`common/config/rush/.npmrc`](common/config/rush/.npmrc)                     | Contains `minimum-release-age` and `minimum-release-age-exclude` entries for Rush-managed installs |

### Why no root `.npmrc` is required in this repo

All CI workflows use Rush wrappers (`rush install`, `rush update`) — there are no direct `pnpm install` calls
in `.github/workflows/`. Rush always uses `common/config/rush/.npmrc` for installs, so a root `.npmrc` is
not needed.

This is different from repos where workflows invoke `pnpm` directly in nested workspaces.

## 1. Global Overrides in `pnpm-config.json`

### Purpose

Overrides in the `globalOverrides` field force specific versions of transitive dependencies across the entire
monorepo, typically to patch security vulnerabilities.

**Important:** Overrides only affect **vulnerable** version ranges. Newer safe versions are
NOT affected and will be used as-is.

### Current overrides

See [`common/config/rush/pnpm-config.json`](common/config/rush/pnpm-config.json) — each override has an
inline comment with the CVE/GHSA reference and reason. They look like this:

```jsonc
"globalOverrides": {
  // Fix ReDoS vulnerability (GHSA-xxxx-yyyy-zzzz)
  "example-lib@<2.3.1": "2.3.1",
  // Fix prototype pollution - only affects 2.x range (GHSA-aaaa-bbbb-cccc)
  "another-lib@>=2.0.0 <2.5.0": "2.5.0"
}
```

## 2. Minimum Release Age Exclusions

### Purpose

The `minimum-release-age=10080` setting (7 days) prevents installation of very recent packages. Exclusions
allow security patches to be installed immediately.

### Current exclusions

See [`common/config/rush/.npmrc`](common/config/rush/.npmrc) — each temporary exclusion has a comment with
the release date and a `remove after` date. They look like this:

```
# Internal packages - always allow latest
minimum-release-age-exclude[]=@digitraffic/common

# Security vulnerability fixes - temporary exclusions for packages newer than 7 days
# Released 2026-08-05 - remove after 2026-08-12:
minimum-release-age-exclude[]=example-lib@2.3.1
# example-lib2: version-specific exclude doesn't work, use package name only
minimum-release-age-exclude[]=example-lib2
```

```bash
# Find exclusions due for review
grep -n "remove after" common/config/rush/.npmrc
```

### Notes on version-specific excludes

- `minimum-release-age-exclude[]=package@version` — works when `globalOverrides` pins that exact version
- `minimum-release-age-exclude[]=package` (no version) — use when upstream directly requires the version,
  bypassing the globalOverrides intercept (e.g., `json-schema-to-typescript` directly requiring `js-yaml@^4.1.0`)

### Correct Format for Multiple Versions

When excluding multiple versions of the same package, use the `||` syntax:
```
minimum-release-age-exclude[]=package@1.0.0 || 2.0.0 || 3.0.0
```

**NOT** separate lines like:
```
# WRONG - use || instead
minimum-release-age-exclude[]=package@1.0.0
minimum-release-age-exclude[]=package@2.0.0
```

## 3. How to Check If Overrides/Exclusions Can Be Removed

### Quick check with helper script

```bash
./check-global-overrides.sh
```

This compares override target versions against the lockfile to show which overrides are still actively pinning packages.

### Step 1: Check if upstream dependencies have updated

```bash
# Check what depends on the overridden package
cd common/temp
pnpm why <package>
```

### Step 2: Check package ages

```bash
# Check when a package was published
npm info <package>@<version> time --json
```

If the package is older than 7 days, the `minimum-release-age-exclude` entry can be removed.

### Step 3: Test removal of an override

1. Comment out the override in `common/config/rush/pnpm-config.json`
2. Comment out the corresponding exclusion in `common/config/rush/.npmrc`
3. Run:
   ```bash
   rush update --full
   ```
4. If successful, the override is no longer needed
5. If it fails with `ERR_PNPM_NO_MATURE_MATCHING_VERSION`, the exclusion is still needed
6. Run `rush rebuild` and tests to ensure nothing breaks

### Step 4: Check for new vulnerabilities

```bash
rush audit
```

For machine-readable output or other pnpm-specific flags:

```bash
cd common/temp
pnpm audit --json > audit-report.json
pnpm audit
```

### Step 5: Review each override individually

For each override in `common/config/rush/pnpm-config.json`:

a. **Check the CVE** (if listed in the comment):
   - Visit https://nvd.nist.gov/ or https://github.com/advisories
   - Verify which versions are affected and which version fixes it

b. **Check current usage**:
   ```bash
   grep "^  /<package>@" common/temp/pnpm-lock.yaml
   ```

c. **Check npm for latest**:
   ```bash
   npm view <package> versions --json | jq '.[-10:]'
   ```

d. **Try removing the override**:
   1. Comment out the line in `pnpm-config.json`
   2. Run: `rush update --full`
   3. Run: `rush audit`
   4. Run: `rush rebuild`
   5. If no vulnerabilities appear and build succeeds, the override can be removed

### Step 6: Bulk testing (advanced)

```bash
# 1. Create a backup
cp common/config/rush/pnpm-config.json common/config/rush/pnpm-config.json.backup

# 2. Comment out overrides you want to test, then:
rush purge
rush update --full
rush audit
rush rebuild

# 3. If problems, restore backup
# cp common/config/rush/pnpm-config.json.backup common/config/rush/pnpm-config.json
```

## 4. How to Add New Overrides

### When to add an override

- A transitive dependency has a known security vulnerability
- Upstream packages haven't updated to require the patched version
- You need to force a specific version across the monorepo

### Steps to add a new override

1. **Add the override to `common/config/rush/pnpm-config.json`:**

   ```jsonc
   "globalOverrides": {
     // ... existing overrides ...

     // Fix ReDoS vulnerability in example-lib (GHSA-xxxx-yyyy-zzzz)
     "example-lib@<2.3.1": "2.3.1"
   }
   ```

   Use a version range that covers only the vulnerable versions. Check the advisory for the exact range:
   - `"<2.3.1"` — all versions below 2.3.1 are vulnerable
   - `">=2.0.0 <2.3.1"` — only the 2.x range is vulnerable (1.x is separately maintained or unaffected)

2. **Add exclusion to `common/config/rush/.npmrc`** (only if the safe version is < 7 days old):

   ```
   # Released 2026-08-05 - remove after 2026-08-12:
   minimum-release-age-exclude[]=example-lib@2.3.1
   ```

   If upstream directly requires the version (version-specific exclude won't intercept it), use package name only:

   ```
   # Released 2026-08-05 - remove after 2026-08-12:
   minimum-release-age-exclude[]=example-lib
   ```

3. **Update this document** if the behavior or structure changes

4. **Test:**
   ```bash
   rush update --full
   rush rebuild
   ```

## 5. Upgrading Dependencies to Latest Versions

### Understanding the difference

| Command                    | What it does                                                                |
|----------------------------|-----------------------------------------------------------------------------|
| `rush update --full`       | Resolves dependencies based on **existing** version ranges in package.json  |
| `rush upgrade-interactive` | **Updates package.json** files to latest versions (like `pnpm up --latest`) |

### ⚠️ Important: minimum-release-age is NOT honored during selection

`rush upgrade-interactive` queries the npm registry directly and shows **ALL** available versions, including
those published less than 7 days ago. The `minimum-release-age=10080` constraint from `.npmrc` is only
enforced when `rush update` runs **after** you select versions.

If you select a version that's too new:

1. `rush upgrade-interactive` will update package.json
2. The subsequent `rush update` will fail with `ERR_PNPM_NO_MATURE_MATCHING_VERSION`
3. You'll need to either:
   - Revert the package.json change and select an older version
   - Add a `minimum-release-age-exclude` entry to `.npmrc` (if it's a security patch)

### How to upgrade safely

```bash
# Option 1: Interactive upgrade (rush update runs automatically after)
./update-deps.sh

# Option 2: Update package.json only, then check constraints separately
./update-deps.sh --skip-update
rush update --full  # This enforces minimum-release-age

# Option 3: Just CDK packages
./update-deps.sh '/^@?aws-cdk/'

# Option 4: Rush command (for CI/automation)
rush repo:update-deps-mature
rush update --full
```

### After upgrading

1. Review changes in package.json files
2. Run `rush rebuild` to ensure everything compiles
3. Run tests
4. Check for new vulnerabilities: `cd common/temp && pnpm audit`

## 6. Review Schedule

- Review overrides and exclusions monthly or when upgrading major dependencies
- Find temporary exclusions due for removal:
  ```bash
  grep -n "remove after" common/config/rush/.npmrc
  ```
- Run `./check-global-overrides.sh` to see which overrides are still actively pinning packages

---

For further questions, refer to:

- [pnpm overrides documentation](https://pnpm.io/package_json#pnpmoverrides)
- [Rush pnpm-config.json documentation](https://rushjs.io/pages/configs/pnpm-config_json/)
- [pnpm minimum-release-age](https://pnpm.io/settings#minimumreleageage)
