#!/usr/bin/env bash

# Updates all CDK dependencies to the newest version

# exit on any error
set -euo pipefail

# Match aws-cdk (CLI), aws-cdk-lib, and @aws-cdk/* scoped packages
PACKAGE=${1:-"/^@?aws-cdk/"}
COOLDOWN_DAYS=${COOLDOWN_DAYS:-7}
SKIP_RUSH_UPDATE=${SKIP_RUSH_UPDATE:-0}

# Find all package.json files in project directories and update CDK packages
for dir in other road marine aviation rail tools template; do
  find "$dir" -maxdepth 2 -name "package.json" -exec dirname {} \; | while read -r subdir; do
    echo "Updating $subdir"
    (
      cd "$subdir" &&
        npx --yes npm-check-updates@19.6.3 \
          --filter "$PACKAGE" \
          --target greatest \
          --cooldown "${COOLDOWN_DAYS}d" \
          --no-deprecated \
          --pre false \
          -u
    )
  done
done

echo ""
echo "Done! Now running 'rush update --full' to apply changes (still enforces minimum release age in Rush)."
echo ""
if [[ "$SKIP_RUSH_UPDATE" == "1" ]]; then
  echo "Skipping 'rush update --full' because this script is running from a Rush command."
  echo "Run this next from shell: rush update --full"
else
  rush update --full
fi
