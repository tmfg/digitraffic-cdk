#!/usr/bin/env sh

ENVIRONMENT=${1:-dev}
COMMAND=${2:-migrate}
NETWORK=${3:-dbmarine}

docker build \
-t marinecam-db-updater \
. \
--build-arg ENVIRONMENT=$ENVIRONMENT

docker run --rm \
--name marinecam-db-updater \
--network $NETWORK \
marinecam-db-updater \
$COMMAND
