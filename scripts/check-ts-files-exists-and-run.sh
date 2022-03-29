#!/usr/bin/env bash
set -e # Fail on error

# This check if ts-files are found in given directory and then runs given command.
# Run: ./build-canaries-if-exists.sh 'canaries/dir' 'cmd'
# Ie.
# Run: ./build-canaries-if-exists.sh 'lib/canaries' 'echo canaries files found'

files_exists() {
    [ -e "$1" ]
}

EXECUTE_DIR=$(pwd)

CANARIES_DIR=${1:-"NO CANARIES DIR GIVEN"}
COMMAND_TO_RUN=${2:-"NO COMMAND GIVEN"}

if files_exists ${CANARIES_DIR}/*.ts;
then
  echo "Canaries exists in ${CANARIES_DIR}"
  eval ${COMMAND_TO_RUN}
else
  echo "Canaries not exists in ${CANARIES_DIR}"
fi

