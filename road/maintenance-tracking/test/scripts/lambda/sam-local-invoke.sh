#!/usr/bin/env bash

SCRIPT_DIR="$(dirname "$0")"
echo ${SCRIPT_DIR}

cd "$(dirname "$0")"
cd ../../..
echo "The script you are running has basename `basename "$0"`, dirname `dirname "$0"`"
echo "The present working directory is `pwd`"

set -x

sam local invoke MaintenanceTrackingProcessQueue0DB4E4DC --env-vars test/scripts/lambda/env.json --event test/scripts/lambda/event.json
