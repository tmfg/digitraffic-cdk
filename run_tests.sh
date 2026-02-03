#!/usr/bin/env bash

# exit on any error
set -e

# ignore case in string matching
shopt -s nocasematch

if [ -z "$1" ]; then
  # Should this be just rush test?
  ./run_tests_in.sh other && ./run_tests_in.sh marine && ./run_tests_in.sh road && ./run_tests_in.sh rail && ./run_tests_in.sh aviation
elif [ $1 == 'other' ]; then
  ./run_tests_in.sh other
elif [ $1 == 'marine' ]; then
  ./run_tests_in.sh marine
elif [ $1 == 'road' ]; then
  ./run_tests_in.sh road
elif [ $1 == 'rail' ]; then
  ./run_tests_in.sh rail
elif [ $1 == 'aviation' ]; then
  ./run_tests_in.sh aviation
else
  echo "Allowed arguments: empty=all, 'other'. 'marine', 'road', 'rail' or 'aviation'"
fi
