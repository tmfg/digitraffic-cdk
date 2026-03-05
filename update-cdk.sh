#!/usr/bin/env bash

# Updates all CDK dependencies to the newest version

# exit on any error
set -ex

# Match aws-cdk (CLI), aws-cdk-lib, and @aws-cdk/* scoped packages
PACKAGE=${1:-"/^@?aws-cdk/"}

# Find all package.json files in project directories and update CDK packages
for dir in other road marine aviation rail tools template; do
  find "$dir" -maxdepth 2 -name "package.json" -exec dirname {} \; | while read -r subdir; do
    echo "Updating $subdir"
    (cd "$subdir" && npx --yes npm-check-updates@19.6.2 -f "$PACKAGE" -u)
  done
done

echo ""
echo "Done! Now running 'rush update --full' to apply changes (enforces 7-day minimum release age)."
echo ""
rush update --full
