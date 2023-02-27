#!/usr/bin/env bash
set -e # Fail on error

# This script tries to run cdk bootstrap for cdk stack in given environment
echo "Required parameters: <app>-<env>"
echo "For example: road-test"

FULL_ENV=${1:-"NONE"}
echo "<app>-<env>: ${FULL_ENV}"

SCRIPT_DIR=$(dirname "$0")
. ${SCRIPT_DIR}/cdk-set-env.sh ${FULL_ENV}

read -p "Are you sure you wanna run: pnpm dlx cdk@latest bootstrap for ${FULL_ENV}? " -n 1 -r
echo    # move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo "Start at $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
  echo "pnpm dlx cdk@latest bootstrap"
  pnpm dlx cdk@latest bootstrap
fi

set +x

echo "End at $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
