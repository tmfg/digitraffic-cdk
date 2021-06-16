#!/usr/bin/env sh

ENVIRONMENT=${1:-dev}
COMMAND=${2:-migrate}

docker run --rm \
--name portactivity-db-updater \
-v $(pwd)/conf/$ENVIRONMENT:/flyway/conf \
-v $(pwd)/update:/flyway/sql \
--network=dnet1 \
flyway/flyway \
$COMMAND
