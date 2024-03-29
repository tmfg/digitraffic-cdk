#!/usr/bin/env sh

ENVIRONMENT=${1:-dev}
COMMAND=${2:-migrate}

docker build \
-t portactivity-db-updater \
. \
--build-arg ENVIRONMENT=$ENVIRONMENT

docker run --rm \
--name portactivity-db-updater \
--network dbmarine \
portactivity-db-updater \
$COMMAND
