#!/usr/bin/env bash

# Runs all tests or tests for a specific workspace

# exit on any error
set -e

if [ -z "$1" ]
then
  yarn workspace common run test
  yarn workspace other run test
else
  yarn workspace $1 run test
fi
