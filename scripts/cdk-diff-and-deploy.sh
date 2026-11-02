#!/usr/bin/env bash
set -e # Fail on error
CONCURRENCY=0

# Check version from https://www.npmjs.com/package/aws-cdk?activeTab=versions
# With 7 day cooldown
CDK_VERSION=2.1145.0

# This script tries to do diff or deploy for cdk stack in given environment
echo "Required parameters: <app>-<env> <diff|deploy> [stackName]"
echo "For example: road-test diff"

FULL_ENV=${1:-"NONE"}
echo "<app>-<env>: ${FULL_ENV}"

SCRIPT_DIR=$(dirname "$0")
. "${SCRIPT_DIR}/cdk-env.conf" "${FULL_ENV}"

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


# Usage: requireCmd <command> <install command> [args...]
# Example: requireCmd git brew install git
# Example open jdk 11: requireCmd $(/usr/libexec/java_home -v 11.0)/bin/java brew install --cask adoptopenjdk11
requireCmd() {
    local cmd=$1
    shift
    command -v "${cmd}" >/dev/null 2>&1 || { echo >&2 "Command ${cmd} is not installed. Installing..."; "$@"; }
}
# We need gsed command
requireCmd gsed brew install gnu-sed

# Try to find app properties .ts -file in bin dir of working dir
EXECUTE_DIR=$(pwd)
ALL_TS_FILES_IN_BIN=( "$EXECUTE_DIR"/src/bin/*-app.ts )
# Take first .ts file and assume it is the app config file
APP_TS=${ALL_TS_FILES_IN_BIN[0]}
echo "Found app config: ${APP_TS}"
echo
# Get stack name (take first match ie. grep -i 'new ' <the-file> | grep -i marineprod |  cut -d "'" -f2 | head -1
# sed replaces single quotes (old way) with double quotes (new way)
if [[ "${STACK_NAME}" == "NONE" ]]; then
    echo "REGEX=\"[A-Za-z0-9-]*${DT_PROJECT}[A-Za-z0-9-]*${DT_PROJECT_ENV}[A-Za-z0-9-]*\""
    # Take first line of grep match and strip off double quotes
    STACK=$(grep -Ei "\"[A-Za-z0-9-]*${DT_PROJECT}[A-Za-z0-9-]*${DT_PROJECT_ENV}[A-Za-z0-9-]*\"" "${APP_TS}" | cut -d '"' -f2 | head -1)
else
    STACK=${STACK_NAME}
fi


if [ -z "${STACK}" ]
then
      echo "Could not find the stack for ${DT_PROJECT} ${DT_PROJECT_ENV}"
exit 1;
fi

echo "Using Stack: ${STACK}"
echo

DO_OPERATION=false
if [[ "${OPERATION}" == "diff" ]]; then
    DO_OPERATION=true
# AUTO_APPROVE=true skips the confirmation. Give it on the command line,
# for example: AUTO_APPROVE=true rushx cdk-deploy-all-test
elif [[ "${AUTO_APPROVE:-false}" == "true" ]]; then
    echo "AUTO_APPROVE=true, skipping confirmation for: ${OPERATION} ${STACK}"
    DO_OPERATION=true
else
    read -p "Are you sure you wanna run: npx --yes aws-cdk@${CDK_VERSION} ${OPERATION} ${STACK}? " -n 1 -r
    echo    # move to a new line
    if [[ "$REPLY" =~ ^[Yy]$ ]]
    then
        DO_OPERATION=true
    else
        # Fail so that a chained command, such as cdk-deploy-all-prod,
        # stops instead of continuing with the remaining environments.
        echo "Aborted by user."
        exit 1
    fi
fi

if [[ "${DO_OPERATION}" == true ]]
then
  echo "Start at $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
  echo
  echo "npx --yes aws-cdk@${CDK_VERSION} ${OPERATION} ${STACK}"
  echo

  if [[ "${OPERATION}" == "diff" ]]
  then
      CDK_OUT=/tmp/cdk-out-${STACK}
      # Use script too capture command output and save it to file
      # NOTE: --concurrency is a "cdk deploy"-only option, not supported by "cdk diff"
      script "${CDK_OUT}.txt" npx --yes "aws-cdk@${CDK_VERSION}" "${OPERATION}" "${STACK}" --debug

      read -p "Do you wanna see formatted diff in browser? " -n 1 -r
      echo    # move to a new line
      if [[ "$REPLY" =~ ^[Yy]$ ]]
      then
        SKIP_LINES_PATTERN="pnpm\|dlx-\|Downloading"
        # first grep takes lines without green, gsed removes ansi colour codes and last grep removes unwanted lines
        grep -E -v '\x1b\[32m' "${CDK_OUT}.txt" | gsed -e 's/\x1b\[[0-9;]*m//g' | grep -v "${SKIP_LINES_PATTERN}" > "${CDK_OUT}-old.txt"
        # first grep takes lines without red, gsed removes ansi colour codes and last grep removes unwanted lines
        grep -E -v '\x1b\[31m' "${CDK_OUT}.txt" | gsed -e 's/\x1b\[[0-9;]*m//g' | grep -v "${SKIP_LINES_PATTERN}" > "${CDK_OUT}-new.txt"
        # Make a diff with full context and convert it to html
        diff -u -U 1000000 "${CDK_OUT}-old.txt" "${CDK_OUT}-new.txt" | npx --yes diff2html-cli@5.2.15 -i stdin --style side -d char  --title "CDK diff ${FULL_ENV}: ${STACK}"
      fi
    else
        # CDK itself asks approval for security changes. Skip it only when
        # AUTO_APPROVE is set, otherwise keep the default behaviour.
        if [[ "${AUTO_APPROVE:-false}" == "true" ]]; then
            npx --yes "aws-cdk@${CDK_VERSION}" "${OPERATION}" "${STACK}" --debug --concurrency="${CONCURRENCY}" --require-approval never
        else
            npx --yes "aws-cdk@${CDK_VERSION}" "${OPERATION}" "${STACK}" --debug --concurrency="${CONCURRENCY}"
        fi
    fi
fi

set +x

echo "End at $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
