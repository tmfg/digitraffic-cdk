#!/usr/bin/env bash

# Updates all project dependencies (for versioning conventions see CONVENTIONS.md)

# exit on any error
set -euo pipefail

# How long a release must exist before it is allowed for upgrades.
COOLDOWN_DAYS=${COOLDOWN_DAYS:-7}

# npm-check-updates target strategy. "greatest" selects the highest semver that
# is outside the cooldown window.
TARGET=${TARGET:-greatest}

# Optional package filter as first positional argument.
# Examples:
#   ./update-deps.sh '/^vitest$/'
#   ./update-deps.sh '/^@aws-sdk\//'
PACKAGE_FILTER=${1:-"/.*/"}
SKIP_RUSH_UPDATE=${SKIP_RUSH_UPDATE:-0}

echo "Updating dependencies with cooldown=${COOLDOWN_DAYS}d target=${TARGET} filter=${PACKAGE_FILTER}"

for dir in other road marine aviation rail tools template; do
  find "$dir" -maxdepth 2 -name "package.json" -exec dirname {} \; | while read -r subdir; do
    echo "Updating $subdir"
    (
      cd "$subdir" &&
        npx --yes npm-check-updates@19.6.3 \
          --filter "$PACKAGE_FILTER" \
          --target "$TARGET" \
          --cooldown "${COOLDOWN_DAYS}d" \
          --pre false \
          --reject '/^@digitraffic-cdk\//' \
          -u
    )
  done
done

if [[ "$SKIP_RUSH_UPDATE" == "1" ]]; then
  echo ""
  echo "Skipping 'rush update --full' because this script is running from a Rush command."
  echo "Run this next from shell: rush update --full"
  echo "Then run: rush update-autoinstaller --name rush-command-line-tools"
else
  rush update --full
fi
