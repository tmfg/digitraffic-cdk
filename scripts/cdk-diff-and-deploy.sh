#!/usr/bin/env bash
set -e # Fail on error

# This script tries to do diff or deploy for cdk stack in given environment
echo "Required parameters: <app>-<env> <diff|deploy> [stackName]"
echo "For example: road-test diff"

FULL_ENV=${1:-"NONE"}
echo "<app>-<env>: ${FULL_ENV}"

SCRIPT_DIR=$(dirname "$0")
. ${SCRIPT_DIR}/cdk-set-env.sh ${FULL_ENV}

OPERATION=${2:-"NONE"}
STACK_NAME=${3:-"NONE"}

case "$OPERATION" in
  ("diff"):
    echo "Do cdk diff"
  ;;
  ("deploy"):
    echo "Do cdk deploy"
  ;;
  (*) echo "Invalid second parameter: ${OPERATION}."
      echo "Valid values are 'diff' and 'deploy'"
      echo
  exit 1
  ;;
esac
echo


# Try to find app properties .ts -file in bin dir of working dir
EXECUTE_DIR=$(pwd)
ALL_TS_FILES_IN_BIN=( "$EXECUTE_DIR/bin/*-app.ts" )
# Take first .ts file and assume it is the app config file
APP_TS=${ALL_TS_FILES_IN_BIN[0]}
echo Found app config: $APP_TS
echo
# Get stack name (take first match ie. grep -i 'new ' <the-file> | grep -i marineprod |  cut -d "'" -f2 | head -1
# sed replaces single quotes (old way) with double quotes (new way)
if [[ "${STACK_NAME}" == "NONE" ]]; then
    STACK=$(grep -i 'new ' ${APP_TS} | grep -i "${DT_PROJECT}${DT_PROJECT_ENV}"  | gsed  "s/'/\"/g" |  cut -d '"' -f2 | head -1)
else
    STACK=${STACK_NAME}
fi

echo "Using Stack: ${STACK}"
echo

read -p "Are you sure you wanna run: cdk ${OPERATION} ${STACK}? " -n 1 -r
echo    # move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo "Start at $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
  echo "pnpm dlx cdk@latest ${OPERATION} ${STACK}"
  pnpm dlx cdk@latest ${OPERATION} ${STACK} --debug --concurrency=5
fi

set +x

echo "End at $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
