# Digitraffic AWS CDK projects

This project contains CDK applications for the
[Digitraffic](https://www.digitraffic.fi) project.

Projects are categorized as:

- projects under other are generic, e.g. swagger-joiner
- projects under road or marine are related to a mode of transport, e.g.
  road/variable-signs

## Links

- [Developer guide](DEVELOPMENT.md)
- [Architecture](ARCHITECTURE.md)
- [Conventions](CONVENTIONS.md)

Digitraffic is operated by [Fintraffic](https://www.fintraffic.fi)

## TL;DR

### Init rush, (e.g., installs Git hooks).

```shell
rush install
rush update-autoinstaller --name rush-command-line-tools
rush update
```

### Update dependencies for all projects

All dependency updates use `./update-deps.sh` which automatically runs: `rush update --full`, `rush update-autoinstaller`, `rush install`

**Update all dependencies (recommended)**

```shell
# Updates all dependencies with 7-day cooldown (excludes typescript and @types/node)
./update-deps.sh

# Audit dependency vulnerabilities
rush audit

# Verify everything builds
rush rebuild
```

**Update CDK dependencies only**

```shell
# Update only AWS CDK packages (aws-cdk, aws-cdk-lib, @aws-cdk/*)
./update-deps.sh '/^@?aws-cdk/'

# Audit dependency vulnerabilities
rush audit

# Verify everything builds
rush rebuild
```

**Update specific packages**

```shell
# Update only vitest-related packages
./update-deps.sh '/^@?vitest|^vitest$/'

# Audit dependency vulnerabilities
rush audit

# Update only AWS SDK packages
./update-deps.sh '/^@aws-sdk\//'

# Audit dependency vulnerabilities
rush audit

# Update multiple specific packages
./update-deps.sh '/^(vitest|esbuild)$/'

# Audit dependency vulnerabilities
rush audit

# Verify everything builds
rush rebuild
```

**Check global overrides still needed**

```shell
./check-global-overrides.sh
```

See [DEPENDENCY_OVERRIDES.md](DEPENDENCY_OVERRIDES.md) for the full review flow.

**Advanced: Environment variables**

```shell
# Customize cooldown and target strategy for update-deps.sh
COOLDOWN_DAYS=7 TARGET=greatest ./update-deps.sh
```

**Advanced: Rush commands (for CI/automation)**

```shell
# Update with SKIP_RUSH_UPDATE=1 (doesn't run final steps automatically)
rush repo:update-deps-mature

# Then manually run:
rush update --full
rush update-autoinstaller --name rush-command-line-tools
rush rebuild
```

### Update toolchain (Node, Rush, pnpm, CDK CLI)

When updating the toolchain versions, update these files manually:

**1. Node.js version**

Check latest versions with **individual release dates**:
- [Node.js releases on GitHub](https://github.com/nodejs/node/releases) - Each release with exact date
  - Find "Version 24." to find the latest 24.x release (e.g., 24.18.1)
- [Node.js v24.x changelog](https://github.com/nodejs/node/blob/main/doc/changelogs/CHANGELOG_V24.md) - Detailed v24 release history with dates
- [Node.js release schedule](https://github.com/nodejs/release#release-schedule) - LTS timeline

Edit [.node-version](.node-version):
```
node/24.18.1
```

**2. Rush and pnpm versions**

Check latest versions with release dates:
- [Rush on npm](https://www.npmjs.com/package/@microsoft/rush?activeTab=versions) - Version history with dates
- [pnpm on npm](https://www.npmjs.com/package/pnpm?activeTab=versions) - Version history with dates

Edit [rush.json](rush.json):
```json
{
  "nodeSupportedVersionRange": ">=24.0.0 <25.0.0",
  "rushVersion": "5.178.0",
  "pnpmVersion": "10.33.0"
}
```

**3. CDK CLI version**

Check latest versions with release dates:
- [aws-cdk CLI on npmjs](https://www.npmjs.com/package/aws-cdk?activeTab=versions) - CLI version history

> **Note:** This is only for the CLI tool used in deployment scripts. The CDK library (`aws-cdk-lib`) in package.json is updated automatically via `./update-deps.sh`.

Edit [scripts/cdk-diff-and-deploy.sh](scripts/cdk-diff-and-deploy.sh) for CLI version:
```bash
CDK_VERSION=2.1134.0
```

**4. After toolchain updates**

```shell
rush update --full
rush update-autoinstaller --name rush-command-line-tools
rush rebuild
```

### Update digitraffic-common subtree

The `lib/digitraffic-common` is a git subtree from the [digitraffic-common repository](https://github.com/tmfg/digitraffic-common).

**Note:** Projects consume `@digitraffic/common` as an npm package, not directly from the subtree.

**Pull latest changes from common repository:**

```shell
# Pull latest common changes
rush common-subtree -c pull -r master

# Commit the subtree update
git add lib/digitraffic-common
git commit -m "Update digitraffic-common subtree"
```

**Push changes to common repository:**

If you made changes to files under `lib/digitraffic-common`:

```shell
# Push changes back to common repository
rush common-subtree -c push -r master
```

See full guide: [Digitraffic-common maintenance](https://finrail.atlassian.net/wiki/spaces/DT/pages/2664530424/Digitraffic-common)

### Format

```shell
rush format:package-json
rush format:fix
```

## Rush commands

Global Rush commands are configured in
[command-line.json](common/config/rush/command-line.json)

You can list them with:

```shell
rush --help
```
