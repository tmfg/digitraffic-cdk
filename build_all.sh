#!/usr/bin/env bash

# Builds all projects

# exit on any error
set -ex

function buildInDirectory() {
    if [ "$1" != "./elasticsearch" ]; then
      cd "$1"
      npm run build
      cd ..
    fi
}

function buildAllInDirectory() {
  cd "$1"
  for d in $(find ./* -maxdepth 0 -type d); do
    buildInDirectory $d
  done
  cd ..
}

buildInDirectory common
buildInDirectory cloudfront
buildInDirectory es-key-figures
buildInDirectory user-management
buildInDirectory status
buildInDirectory swagger-joiner

buildAllInDirectory road
buildAllInDirectory marine
