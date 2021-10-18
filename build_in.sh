#!/usr/bin/env bash

# Exit on any error
set -e

cd "$1"
for d in $(find ./* -maxdepth 0 -type d); do
  echo "Building in $d"
  cd "$d"
  if [ -f package.json ]; then
    yarn run build
  fi
  cd ..
done
cd ..
