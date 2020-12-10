#!/usr/bin/env bash

ENV=${1:-"NONE"}

case "$ENV" in
  ("test"):
    . ../cdk-set-env-road-test.sh
    cdk diff MaintenanceTrackingRoadTest
  ;;
  ("prod"):
    . ../cdk-set-env-road-prod.sh
    cdk diff MaintenanceTrackingRoadProd
  ;;
  (*) echo "Allowed parameter values are 'test' and 'prod'" ;;
esac
