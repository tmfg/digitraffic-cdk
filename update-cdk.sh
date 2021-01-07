#!/usr/bin/env bash

# Updates all CDK dependencies to the newest version

# exit on any error
set -ex

PACKAGE=${1:-@aws-cdk}

function updateInDirectory() {
    if [ "$1" != "./elasticsearch" ]; then
      cd "$1"

      if [ -f package.json ]; then
        rm -f package-lock.json
        rm -rf node_modules
        ncu -f /$PACKAGE/ -u

        npm install
      fi

      cd ..
    fi

}

function updateAllInDirectory() {
  cd "$1"

  for d in $(find ./* -maxdepth 0 -type d); do
    updateInDirectory $d
  done

  cd ..
}

updateInDirectory common
updateInDirectory cloudfront
updateInDirectory user-management
updateInDirectory swagger-joiner

updateAllInDirectory road
updateAllInDirectory marine