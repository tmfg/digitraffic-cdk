#!/usr/bin/env bash

# Runs all tests or tests for a specific workspace

# exit on any error
set -e

if [ -z "$1" ]
then
  echo "no arg"
  yarn workspaces run test
else
  yarn workspace $1 run test
fi
