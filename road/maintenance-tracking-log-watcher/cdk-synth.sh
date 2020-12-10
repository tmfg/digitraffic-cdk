#!/usr/bin/env bash

cdk synth MaintenanceTrackingRoadTest --no-staging > template.yaml

ENV=${1:-"NONE"}

case "$ENV" in
  ("test"):
    cdk synth MaintenanceTrackingLogWatcherTest --no-staging > template-status-test.yaml
  ;;
  ("prod"):
    cdk synth MaintenanceTrackingLogWatcherProd --no-staging > template-status-prod.yaml
  ;;
  (*) echo "Allowed parameter values are 'test' and 'prod'" ;;
esac