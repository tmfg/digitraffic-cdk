#!/usr/bin/env bash

ENV=${1:-"NONE"}

#CloudfrontRoadTest
#CloudfrontRoadProd
#CloudfrontMarineTest
#CloudfrontMarineProd

echo "Diff CloudFront for $ENV"

case "$ENV" in
  ("road-test"):
    cdk synth CloudWatchLogsRecipientTest --no-staging > template-status-test.yaml
  ;;
  ("road-prod"):
    cdk synth CloudWatchLogsRecipientPRod --no-staging > template-status-prod.yaml
  ;;
  (*) echo "Allowed parameter values are 'status-test', 'status-prod'" ;;
esac
