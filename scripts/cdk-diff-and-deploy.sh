#!/usr/bin/env bash
set -e # Fail on error

# This script ties to do diff of deploy for cdk stack in given envifonment
ENVS=(road-test road-prod marine-test marine-prod status-test status-prod)

FULL_ENV=${1:-"NONE"}
OPERATION=${2:-"NONE"}

FOUND=false
for value in "${ENVS[@]}"
do
  [[ "$FULL_ENV" = "$value" ]] && FOUND=true
done

ENV_TYPE=$(echo $FULL_ENV | cut -d '-' -f1)
ENV_ENV=$(echo $FULL_ENV | cut -d '-' -f2)

if [[ "${FOUND}"  != "true" ]] ;then
    echo "Invalid first parameter. Valid values are ${ENVS[@]/%/,}"
    exit 1
fi

case "$OPERATION" in
  ("diff"):
    echo "Do cdk diff"
  ;;
  ("deploy"):
    echo "Do cdk deploy"
  ;;
  (*) echo "Invalid second parameter. Valid values are 'diff' and 'deploy'"
  exit 1
  ;;
esac
echo

SCRIPT_DIR=$(dirname "$0")
#echo "The script you are running has basename `basename "$0"`, dirname `dirname "$0"`"
#echo "The present working directory is `pwd`"

# Try to find app properties .ts -file in bin dir of working dir
EXECUTE_DIR=$(pwd)
ALL_TS_FILES_IN_BIN=( "$EXECUTE_DIR/bin/*-app.ts" )
# Take first .ts file and assume it is the app config file
APP_TS=${ALL_TS_FILES_IN_BIN[0]}
echo Found app config: $APP_TS

# Get stack name
STACK=$(grep -i 'new ' ${APP_TS} | grep -i "${ENV_TYPE}" |  grep -i "${ENV_ENV}" |  cut -d "'" -f2)
echo "Using Stack: ${STACK}"

echo SCRIPT_DIR: ${SCRIPT_DIR}

. ${SCRIPT_DIR}/cdk-set-env.sh ${FULL_ENV}
env | grep AWS

echo
read -p "Are you sure you wanna run: cdk ${OPERATION} ${STACK}? " -n 1 -r
echo    # move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
  cdk ${OPERATION} ${STACK}
fi

set +x