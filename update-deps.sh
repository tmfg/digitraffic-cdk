#!/usr/bin/env bash

# Updates all project dependencies (for versioning conventions see CONVENTIONS.md)

# exit on any error
set -euo pipefail

# How long a release must exist before it is allowed for upgrades.
COOLDOWN_DAYS=${COOLDOWN_DAYS:-7}

# npm-check-updates target strategy. "greatest" selects the highest semver that
# is outside the cooldown window.
TARGET=${TARGET:-greatest}

echo "Optional package filter as first positional argument (regex or exact name)."
echo "Examples:"
echo "  ./update-deps.sh                       # update all packages"
echo "  ./update-deps.sh 'vitest'              # exact package name"
echo "  ./update-deps.sh '/^vitest$/'          # exact match via anchored regex"
echo "  ./update-deps.sh '/^@aws-sdk\//'       # all @aws-sdk/* scoped packages"
echo "  ./update-deps.sh '/^aws-cdk-lib$/'     # exact match for aws-cdk-lib"
echo "  ./update-deps.sh '/^(vitest|esbuild)$/' # multiple specific packages"
PACKAGE_FILTER=${1:-"/.*/"}
SKIP_RUSH_UPDATE=${SKIP_RUSH_UPDATE:-0}

echo ""
echo "  cooldown : ${COOLDOWN_DAYS} days"
echo "  target   : ${TARGET}"
echo "  filter   : ${PACKAGE_FILTER}"
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
      echo "  filter   : ${PACKAGE_FILTER}"
      ;;
    *)
      echo "  Please answer y, n, or f <pattern>"
      ;;
  esac
done

echo ""
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
          --no-deprecated \
          --pre false \
          -u
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
