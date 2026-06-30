#!/usr/bin/env bash

# Updates all project dependencies (for versioning conventions see CONVENTIONS.md)
#
# Usage:
#   ./update-deps.sh [package-filter]
#
# Environment variables:
#   COOLDOWN_DAYS   Minimum age (in days) for versions considered by ncu (default: 7)
#   TARGET          ncu target strategy for general dependencies (default: greatest)
#   SKIP_RUSH_UPDATE 1 to skip the final rush update/install phase (default: 0)
#
# Special handling:
#   @digitraffic/common is pinned to npm "latest" when running with the default
#   filter, or when the filter explicitly targets @digitraffic/common.
#
# Scope note:
#   This script intentionally skips the top-level lib/ directory. In this repo,
#   lib/digitraffic-common is a git subtree and must not be modified by
#   automated dependency update runs from update-deps.sh.

# exit on any error
set -euo pipefail

# How long a release must exist before it is allowed for upgrades.
COOLDOWN_DAYS=${COOLDOWN_DAYS:-7}

# npm-check-updates target strategy. "greatest" selects the highest semver that
# is outside the cooldown window.
TARGET=${TARGET:-greatest}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Usage: ./update-deps.sh [package-filter]

Examples:
  ./update-deps.sh
  ./update-deps.sh 'vitest'
  ./update-deps.sh '@digitraffic/common'
  ./update-deps.sh '/^@aws-sdk\//'

Environment variables:
  COOLDOWN_DAYS     Minimum release age in days for ncu lookups (default: 7)
  TARGET            ncu target strategy for general dependencies (default: greatest)
  SKIP_RUSH_UPDATE  Set to 1 to skip rush update/install at the end
EOF
  exit 0
fi

echo "Optional package filter as first positional argument (regex or exact name)."
echo "Examples:"
echo "  ./update-deps.sh                       # update all packages"
echo "  ./update-deps.sh 'vitest'              # exact package name"
echo "  ./update-deps.sh '@digitraffic/common' # update @digitraffic/common only"
echo "  ./update-deps.sh '/^vitest$/'          # exact match via anchored regex"
echo "  ./update-deps.sh '/^@aws-sdk\//'       # all @aws-sdk/* scoped packages"
echo "  ./update-deps.sh '/^aws-cdk-lib$/'     # exact match for aws-cdk-lib"
echo "  ./update-deps.sh '/^(vitest|esbuild)$/' # multiple specific packages"
DEFAULT_PACKAGE_FILTER="/^(?!(typescript|@types\/node)$)/"
PACKAGE_FILTER=${1:-"$DEFAULT_PACKAGE_FILTER"}
SKIP_RUSH_UPDATE=${SKIP_RUSH_UPDATE:-0}

UPDATE_DT_COMMON_WITH_LATEST=0
DT_COMMON_LATEST_VERSION=""

recompute_dt_common_mode() {
  UPDATE_DT_COMMON_WITH_LATEST=0
  if [[ "$PACKAGE_FILTER" == "$DEFAULT_PACKAGE_FILTER" || "$PACKAGE_FILTER" == "@digitraffic/common" || "$PACKAGE_FILTER" == "/^@digitraffic\\/common$/" ]]; then
    UPDATE_DT_COMMON_WITH_LATEST=1
  fi

  DT_COMMON_LATEST_VERSION=""
  if [[ "$UPDATE_DT_COMMON_WITH_LATEST" == "1" ]]; then
    # Retry npm metadata lookup because npm registry responses can occasionally
    # fail transiently. Backoff is 1s, 2s, then 3s.
    for attempt in 1 2 3; do
      if DT_COMMON_LATEST_VERSION=$(npm view @digitraffic/common version 2>/dev/null); then
        break
      fi
      sleep "$attempt"
    done

    if [[ -z "$DT_COMMON_LATEST_VERSION" ]]; then
      echo "Warning: Failed to resolve latest @digitraffic/common version."
      echo "         Continuing without special @digitraffic/common update."
      UPDATE_DT_COMMON_WITH_LATEST=0
    fi
  fi
}

recompute_dt_common_mode

echo ""
echo "  cooldown : ${COOLDOWN_DAYS} days"
echo "  target   : ${TARGET}"
echo "  filter   : ${PACKAGE_FILTER}"
echo "  common   : $([[ "$UPDATE_DT_COMMON_WITH_LATEST" == "1" ]] && echo "pin to latest (${DT_COMMON_LATEST_VERSION})" || echo "same as target")"
echo ""
while true; do
  read -r -p "Continue with these settings? [y]es / [n]o / [f]ilter <pattern>: " answer
  case "$answer" in
    y|Y|yes)
      break
      ;;
    n|N|no)
      echo "Aborted."
      exit 0
      ;;
    f\ *|F\ *)
      PACKAGE_FILTER="${answer#* }"
      recompute_dt_common_mode
      echo "  filter   : ${PACKAGE_FILTER}"
      echo "  common   : $([[ "$UPDATE_DT_COMMON_WITH_LATEST" == "1" ]] && echo "pin to latest (${DT_COMMON_LATEST_VERSION})" || echo "same as target")"
      ;;
    *)
      echo "  Please answer y, n, or f <pattern>"
      ;;
  esac
done

echo ""
echo "Updating dependencies with cooldown=${COOLDOWN_DAYS}d target=${TARGET} filter=${PACKAGE_FILTER}"

# "common/autoinstallers" covers Rush autoinstaller packages (e.g. the
# rush-command-line-tools package that pins Biome). Those are not part of the
# Rush workspace, so neither `rush update` nor the other dirs would update them.
for dir in other road marine aviation rail tools template common/autoinstallers; do
  if [[ ! -d "$dir" ]]; then
    echo "Skipping missing directory: $dir"
    continue
  fi

  find "$dir" -maxdepth 2 -name "package.json" -exec dirname {} \; | while read -r subdir; do
    echo "Updating $subdir"
    (
      cd "$subdir" &&
        npx --yes npm-check-updates@20.0.2 \
          --filter "$PACKAGE_FILTER" \
          --target "$TARGET" \
          --cooldown "${COOLDOWN_DAYS}d" \
          --no-deprecated \
          --pre false \
          -u

      # @digitraffic/common uses calendar-style versions; pin it using npm latest.
      if [[ "$UPDATE_DT_COMMON_WITH_LATEST" == "1" ]] && grep -q '"@digitraffic/common"' package.json; then
        node -e '
const fs = require("fs");
const packageJsonPath = "package.json";
const nextVersion = process.argv[1];
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const depFields = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
let changed = false;

for (const field of depFields) {
  const block = pkg[field];
  if (!block || !Object.hasOwn(block, "@digitraffic/common")) {
    continue;
  }

  // Never overwrite workspace:* — those packages are coupled in the monorepo
  if (block["@digitraffic/common"].startsWith("workspace:")) {
    continue;
  }

  if (block["@digitraffic/common"] !== nextVersion) {
    block["@digitraffic/common"] = nextVersion;
    changed = true;
  }
}

if (changed) {
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`Updated @digitraffic/common to ${nextVersion} in ${process.cwd()}/package.json`);
} else {
  console.log(`@digitraffic/common already at ${nextVersion} in ${process.cwd()}/package.json`);
}
' "$DT_COMMON_LATEST_VERSION"
      fi
    )
  done
done

if [[ "$SKIP_RUSH_UPDATE" == "1" ]]; then
  echo ""
  echo "Skipping 'rush update --full' because this script is running from a Rush command."
  echo "Run this next from shell: rush update --full"
  echo "Then run: rush update-autoinstaller --name rush-command-line-tools"
  echo "And finally: rush install"
else
  rush update --full
  rush update-autoinstaller --name rush-command-line-tools
  rush install
fi
