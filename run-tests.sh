#!/usr/bin/env bash

# Runs all tests in given directory or in subdirectories of current directory

# exit on any error
set -e

DIR=${1:-.}

function testInDirectory() {
    cd "$1"
    if [ -f package.json ]; then
      npm ci
      npm run test
    fi
    cd ..
}

function testAllInDirectory() {
  cd "$1"
  for d in $(find ./* -maxdepth 0 -type d); do
    testInDirectory $d
  done
  cd ..
}

testAllInDirectory $DIR
