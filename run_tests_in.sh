#!/usr/bin/env bash

# exit on any error
set -e

cd "$1"

echo "####"
echo "#### Running ${1} projects tests ####"
echo "####"

for d in $(find ./* -maxdepth 0 -type d); do
  cd "${d}"
  if [ -f package.json ]; then
    dir_name=$(basename "${d}")
    echo "####"
    echo "#### Running tests in ${1}/${dir_name} ####"
    echo "####"
    rushx test
  fi
  cd ..
done
cd ..
