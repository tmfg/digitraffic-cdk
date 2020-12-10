#!/usr/bin/env bash

ENV=${1:-"NONE"}

case "$ENV" in
  ("test"):
    . ../cdk-set-env-road-test.sh
    cdk deploy MaintenanceTrackingRoadTest
  ;;
  ("prod"):
    . ../cdk-set-env-road-prod.sh
    cdk deploy MaintenanceTrackingRoadProd
  ;;
  (*) echo "Allowed parameter values are 'test' and 'prod'" ;;
esac
