#!/usr/bin/env bash

# exit on any error
set -e

# ignore case in string matching
shopt -s nocasematch

if [ -z "$1" ]; then
  ./run_tests_common.sh
  ./run_tests_in.sh other
elif [ $1 == 'marine' ]; then
  ./run_tests_in.sh marine
elif [ $1 == 'road' ]; then
  ./run_tests_in.sh road
else
  echo "Allowed arguments: empty, 'marine' or 'road'"
fi
