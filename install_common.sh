#!/usr/bin/env bash

# Installs common project dependencies from lockfiles

# exit on any error
set -ex

function installInDirectory() {
    if [ "$1" != "./elasticsearch" ]; then
      cd "$1"
      npm ci
      cd ..
    fi
}

function installAllInDirectory() {
  cd "$1"
  for d in $(find ./* -maxdepth 0 -type d); do
    installInDirectory $d
  done
  cd ..
}

installInDirectory common
