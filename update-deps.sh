#!/usr/bin/env bash

# Updates all project dependencies (for versioning conventions see CONVENTIONS.md)

# exit on any error
set -ex

function updateInDirectory() {
    if [ "$1" != "./elasticsearch" ]; then
      cd "$1"

      if [ -f package.json ]; then
        rm -f package-lock.json
        rm -rf node_modules

        npm install
        npm update
        npm run build
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