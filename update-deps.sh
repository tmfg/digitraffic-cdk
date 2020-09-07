#!/usr/bin/env bash

# exit on any error
set -e

if ! npm list --depth 0 --global | grep -q npm-check-updates; then
  echo "npm-check-updates not found, installing.."
  npm install -g npm-check-updates
  echo "..done"
fi

function update() {
  for d in $(find ./* -maxdepth 0 -type d); do
    if [ "$d" != "./common" ] && [ "$d" != "./elasticsearch" ]; then
      cd "$d"
      rm -f package-lock.json
      rm -rf node_modules
      ncu -u --reject pg-promise
      npm install
      npm run build
      cd ..
    fi
  done
}

cd common
update
cd ..

cd road
update
cd ..

cd marine
update
cd ..
