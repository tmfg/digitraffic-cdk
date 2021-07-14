#!/usr/bin/env bash

ENV=${1:-"NONE"}

#CloudfrontRoadTest
#CloudfrontRoadProd
#CloudfrontMarineTest
#CloudfrontMarineProd

echo "Install CloudFront for $ENV"

case "$ENV" in
  ("status-test"):
    . ../cdk-set-env-status-test.sh
    cdk deploy CloudWatchLogsRecipientTest
  ;;
  ("status-prod"):
    . ../cdk-set-env-status-prod.sh
    cdk deploy CloudWatchLogsRecipientProd
  ;;
  (*) echo "Allowed parameter values are 'status-test', 'status-prod'" ;;
esac
