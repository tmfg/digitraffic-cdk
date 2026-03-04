#!/usr/bin/env sh

ENVIRONMENT=${1:-dev}
COMMAND=${2:-migrate}
NETWORK=${3:-dbmarine}

docker build \
-t portactivity-db-updater \
. \
--build-arg ENVIRONMENT=$ENVIRONMENT

docker run --rm \
--name portactivity-db-updater \
--network $NETWORK \
portactivity-db-updater \
$COMMAND
