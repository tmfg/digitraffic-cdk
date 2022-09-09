#!/usr/bin/env bash
set -e # Fail on error

# This script tries to delete given S3 bucket versioned or not
ENVS=(road-test road-prod rail-test rail-prod marine-test marine-prod status-test status-prod aviation-test aviation-prod)

FULL_ENV=${1:-"NONE"}
BUCKET=${2:-"NONE"}

FOUND=false
for value in "${ENVS[@]}"
do
  [[ "$FULL_ENV" = "$value" ]] && FOUND=true
done

# 1. road/marine
ENV_TYPE=$(echo $FULL_ENV | cut -d '-' -f1)
# 2. test/prod
ENV_ENV=$(echo $FULL_ENV | cut -d '-' -f2)

if [[ "${FOUND}"  != "true" ]] ;then
    echo "Invalid first parameter. Valid values are ${ENVS[@]/%/,}"
    exit 1
fi

if [ -z "$2" ]; then
    echo "Invalid second parameter. Bucket name is second required parameter."
    exit 1;
fi

SCRIPT_DIR=$(dirname "$0")
#echo "The script you are running has basename `basename "$0"`, dirname `dirname "$0"`"
#echo "The present working directory is `pwd`"

# Try to find app properties .ts -file in bin dir of working dir
EXECUTE_DIR=$(pwd)

echo "Empty bucket : ${BUCKET}"

echo SCRIPT_DIR: ${SCRIPT_DIR}

. ${SCRIPT_DIR}/cdk-set-env.sh ${FULL_ENV}
env | grep AWS

echo
read -p "Are you sure you wanna delete bucket: ${BUCKET}? " -n 1 -r
echo    # move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo "Start at $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
  echo "aws s3 rm s3://${BUCKET} --recursive"
  aws s3 rm s3://${BUCKET} --recursive

  echo "aws s3 rm s3://${BUCKET} --recursive"
  aws s3 rm s3://${BUCKET} --recursive
  ret=$?
  echo "aws s3api delete-objects --bucket ${BUCKET} --delete \"\$(aws s3api list-object-versions --bucket ${BUCKET} --output=json --query='{Objects: Versions[].{Key:Key,VersionId:VersionId}}')\""
  # aws s3api delete-objects --bucket ${BUCKET} --delete "$(aws s3api list-object-versions --bucket ${BUCKET} --output=json --query='{Objects: Versions[].{Key:Key,VersionId:VersionId}}')"
  VERSIONS=$(aws s3api list-object-versions --bucket ${BUCKET} --output=json --query='{Objects: Versions[].{Key:Key,VersionId:VersionId}}')
  if [[ $VERSIONS != *"null"* ]]; then
    echo "It's there!"
    aws s3api delete-objects --no-paginate --bucket ${BUCKET} --delete "${VERSIONS}"
  fi

  echo "aws s3api delete-objects --bucket ${BUCKET} --delete \"\$(aws s3api list-object-versions --bucket ${BUCKET} --query='{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}')\""
  #aws s3api delete-objects --bucket ${BUCKET} --delete "$(aws s3api list-object-versions --bucket ${BUCKET} --query='{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}')"
  MARKERS=$(aws s3api list-object-versions --bucket ${BUCKET} --query='{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}')
    if [[ $MARKERS != *"null"* ]]; then
      echo "It's there2!"
      aws s3api delete-objects --no-paginate --bucket ${BUCKET} --delete "${MARKERS}"
    fi

  echo "aws s3 rb s3://${BUCKET}"
  aws s3 rb s3://${BUCKET}
fi

set +x

echo "End at $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
