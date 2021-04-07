#!/usr/bin/env bash

# Installs all project dependencies from lockfiles

# exit on any error
set -ex

function installInDirectory() {
    cd "$1"
    npm ci
    cd ..
}

function installAllInDirectory() {
  cd "$1"
  for d in $(find ./* -maxdepth 0 -type d); do
    installInDirectory $d
  done
  cd ..
}

installInDirectory common
installInDirectory cloudfront
installInDirectory elasticsearch
installInDirectory es-key-figures
installInDirectory user-management
installInDirectory status
installInDirectory swagger-joiner

installAllInDirectory road
installAllInDirectory marine
