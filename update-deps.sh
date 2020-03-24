#!/usr/bin/env bash

# exit on any error
set -e

if ! npm list --depth 0 --global | grep -q npm-check-updates; then
  echo "npm-check-updates not found, installing.."
  npm install -g npm-check-updates
  echo "..done"
fi

# update common
cd common
for d in $(find ./* -maxdepth 0 -type d); do
  cd "$d"
  if [ -f package.json ]; then
    ncu -u --reject pg-promise
  fi
  cd ..
done
cd ..

# update others
for d in $(find ./* -maxdepth 0 -type d); do
  if [ "$d" != "./common" ]; then
    cd "$d"
    ncu -u
    npm install
    npm run build
    cd ..
  fi
done

