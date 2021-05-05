#!/usr/bin/env sh

ENVIRONMENT=${1:-dev}

docker run --rm \
--name marinecam-db-updater \
-v $(pwd)/conf/$ENVIRONMENT:/flyway/conf \
-v $(pwd)/update:/flyway/sql \
--network=dnet1 \
flyway/flyway \
migrate
