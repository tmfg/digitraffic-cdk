#!/usr/bin/env sh

ENVIRONMENT=${1:-dev}
COMMAND=${2:-migrate}

docker build \
-t marinecam-db-updater \
. \
--build-arg ENVIRONMENT=$ENVIRONMENT

docker run --rm \
--name marinecam-db-updater \
--network dbmarine \
marinecam-db-updater \
$COMMAND
