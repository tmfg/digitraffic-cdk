#!/usr/bin/env bash
set -e # Fail on error

# This script tries to delete given S3 bucket versioned or not
#ENVS=(road-test road-prod rail-test rail-prod marine-test marine-prod status-test status-prod aviation-test aviation-prod)

FULL_ENV=${1:-"NONE"}
BUCKET=${2:-"NONE"}

SCRIPT_DIR=$(dirname "$0")
. ${SCRIPT_DIR}/cdk-set-env.conf ${FULL_ENV}

# Check second parameter is given
if [ -z "$2" ]; then
    echo "Invalid second parameter. Bucket name is second required parameter."
    exit 1;
fi

read -p "Are you sure you wanna delete bucket: ${BUCKET}? " -n 1 -r
echo # move to a new line
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
    aws s3api delete-objects --bucket ${BUCKET} --delete "${VERSIONS}"
  fi

  echo "aws s3api delete-objects --bucket ${BUCKET} --delete \"\$(aws s3api list-object-versions --bucket ${BUCKET} --query='{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}')\""
  #aws s3api delete-objects --bucket ${BUCKET} --delete "$(aws s3api list-object-versions --bucket ${BUCKET} --query='{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}')"
  MARKERS=$(aws s3api list-object-versions --bucket ${BUCKET} --query='{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}')
    if [[ $MARKERS != *"null"* ]]; then
      aws s3api delete-objects --bucket ${BUCKET} --delete "${MARKERS}"
    fi

  echo "aws s3 rb s3://${BUCKET}"
  aws s3 rb s3://${BUCKET}
fi

set +x

echo "End at $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
