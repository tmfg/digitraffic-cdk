#!/usr/bin/env bash

# exit on any error
set -ex

function update() {
  for d in $(find ./* -maxdepth 0 -type d); do
    if [ "$d" != "./elasticsearch" ]; then
      cd "$d"
      rm -f package-lock.json
      rm -rf node_modules
      npm install
      npm run build
      cd ..
    fi
  done
}

cd road
update
cd ..

cd marine
update
cd ..
