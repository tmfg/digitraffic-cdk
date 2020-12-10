#!/usr/bin/env bash

# Updates all CDK dependencies to the newest version

# exit on any error
set -ex

function update() {
  for d in $(find ./* -maxdepth 0 -type d); do
    if [ "$d" != "./elasticsearch" ]; then
      cd "$d"
      if [ -f package.json ]; then
        ncu -f /@aws-cdk/ -u
        rm -f package-lock.json
        rm -rf node_modules
        npm install
      fi
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
