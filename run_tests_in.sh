#!/usr/bin/env bash

# exit on any error
set -e

cd "$1"
for d in $(find ./* -maxdepth 0 -type d); do
  cd "$d"
  if [ -f package.json ]; then
    yarn test
  fi
  cd ..
done
cd ..
