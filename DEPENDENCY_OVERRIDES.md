# Dependency Overrides and .npmrc Customizations

This project uses dependency overrides and .npmrc customizations to address security vulnerabilities and ensure compatibility with certain packages. This documentation explains the purpose of these modifications, how to check if they are still needed, and how to safely remove them when appropriate.

## 1. Dependency Overrides in `package.json`

### Purpose
Overrides in the `pnpm.overrides` field of `package.json` are used to force specific versions of transitive dependencies, typically to patch vulnerabilities or work around bugs.

#### Current Overrides
These overrides use version range selectors to only affect vulnerable versions, leaving safe versions unchanged:

- `ajv@>=7.0.0-alpha.0 <8.18.0` → `8.18.0`: Fix ReDoS vulnerability (GHSA-2g4f-4pwh-qvx6)
- `fast-xml-parser@<5.3.8` → `5.3.8`: Fix stack overflow and entity bypass vulnerabilities (GHSA-fj3w-jwp8-x2g3, GHSA-m7jm-9gc2-mpf2, GHSA-jmr7-xgp7-cmfj)

### How to Check If Overrides Can Be Removed
1. **Check Upstream Dependencies:**
   - Run `pnpm outdated` and `pnpm why <package>` to see if direct dependencies now require a safe version.
   - Review release notes/changelogs for dependencies that previously required the override.
2. **Remove the Override:**
   - Temporarily remove the override from `package.json`.
   - Run `rm -rf node_modules pnpm-lock.yaml && pnpm install` and check `pnpm audit`.
   - Ensure there are no vulnerabilities reported.
3. **Test the Project:**
   - Run all tests to ensure nothing breaks after removing the override.

## 2. `.npmrc` Customizations

### Purpose
The `.npmrc` file may include `minimum-release-age-exclude` entries to allow installation of very recent package versions (e.g., security patches) before the default waiting period (7 days).

#### Current Exclusions
None. All previously excluded packages are now older than the `minimum-release-age` (7 days).

### How to Check If Exclusions Can Be Removed
1. **Check the Age of the Package:**
   - If the package version is now older than the `minimum-release-age` (default: 7 days), the exclusion can be removed.
2. **Remove the Exclusion:**
   - Delete the relevant line from `.npmrc`.
   - Run `pnpm install` to confirm that the project still installs correctly.

## 3. General Guidance for Overrides and Exclusions
- **Document Each Change:**
  - When adding an override or exclusion, add a comment in this file or in the commit message explaining why it was added and when it can be removed.
- **Review Regularly:**
  - Periodically review overrides and exclusions to ensure they are still necessary.
- **Security:**
  - Always check for security advisories and update overrides/exclusions as soon as upstream dependencies are fixed.

---

For further questions, contact the maintainers or refer to the pnpm documentation: https://pnpm.io/.
