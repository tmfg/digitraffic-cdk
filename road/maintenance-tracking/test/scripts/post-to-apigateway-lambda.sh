#!/usr/bin/env bash

FILE=${1:?"Give path to file to post"}

BASE_URL="https://5xrmdxem70.execute-api.eu-west-1.amazonaws.com/prod"
API_KEY="Xnh2MNqDoety1sXPXpOA30g5B1Hq5uU5LV4lpa5h"
echo "Passing file: $FILE to POST"
echo "File content:"
echo
cat $FILE
echo

set -x
curl -i -X POST -H "x-api-key: ${API_KEY}" -H "Content-Type: application/json" --data @${FILE} ${BASE_URL}/api/integration/maintenance-tracking


#$ curl -X POST -H "x-api-key: theKey" -H "Content-Type: application/json" -d '{"key":"val"}' https://[api-id].execute-api.[region].amazonaws.com
