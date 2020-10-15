#!/usr/bin/env bash

SCRIPT_DIR="$(dirname "$0")"
echo ${SCRIPT_DIR}

cd "$(dirname "$0")"
echo "The script you are running has basename `basename "$0"`, dirname `dirname "$0"`"
echo "The present working directory is `pwd`"
exit;

sam local invoke MaintenanceTrackingProcessQueue0DB4E4DC --env-vars env.json --event event.json
