#!/usr/bin/env bash

# Updates all project dependencies (for versioning conventions see CONVENTIONS.md)

# exit on any error
set -ex

function updateInDirectory() {
    cd "$1"

    if [ -f package.json ]; then
      rm -f package-lock.json
      rm -rf node_modules

      npm install
      npm update
      npm run build
    fi

    cd ..
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
updateInDirectory elasticsearch
updateInDirectory es-key-figures
updateInDirectory user-management
updateInDirectory status
updateInDirectory swagger-joiner

updateAllInDirectory road
updateAllInDirectory marine
