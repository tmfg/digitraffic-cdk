#!/usr/bin/env bash

cdk synth MaintenanceTrackingRoadTest --no-staging > template.yaml

ENV=${1:-"NONE"}

case "$ENV" in
  ("test"):
    cdk synth MaintenanceTrackingRoadTest --no-staging > template-road-test.yaml
  ;;
  ("prod"):
    cdk synth MaintenanceTrackingRoadProd --no-staging > template-road-prod.yaml
  ;;
  (*) echo "Allowed parameter values are 'test' and 'prod'" ;;
esac