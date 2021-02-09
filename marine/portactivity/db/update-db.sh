#!/usr/bin/env sh

docker run --rm \
-v $(pwd)/update:/flyway/sql \
--network=dnet1 \
flyway/flyway \
-url="jdbc:postgresql://db:5432/marine" \
-user=portactivity \
-password=portactivity \
migrate
