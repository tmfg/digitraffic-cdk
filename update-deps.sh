#!/usr/bin/env bash

if ! npm list --depth 0 --global | grep -q npm-check-updates; then
  echo "npm-check-updates not found, installing.."
  npm install -g npm-check-updates
  echo "..done"
fi

# update common
cd common
for d in $(find ./* -maxdepth 0 -type d); do
  cd "$d"
  ncu -u
  cd ..
done
cd ..

# update others
for d in $(find ./* -maxdepth 0 -type d); do
  if [ "$d" != "./common" ]; then
    cd "$d"
    ncu -u
    cd ..
  fi
done

