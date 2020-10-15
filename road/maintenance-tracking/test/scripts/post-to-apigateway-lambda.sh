#!/usr/bin/env bash


BASE_URL=${1:?"1. param is api gw base url ie. https://xyz.execute-api.eu-west-1.amazonaws.com/prod/"}
API_KEY=${2:?"2. param is api key"}
FILE=${3:?"3. param is file to post as payload"}

# Add slash if missing
length=${#BASE_URL}
last_char=${BASE_URL:length-1:1}
[[ $last_char != "/" ]] && BASE_URL="$BASE_URL/"; :

echo "Passing file: $FILE to POST"
echo "File content:"
echo
cat $FILE
echo

set -x
curl -i -X POST -H "x-api-key: ${API_KEY}" -H "Content-Type: application/json" --data @${FILE} ${BASE_URL}api/integration/maintenance-tracking
