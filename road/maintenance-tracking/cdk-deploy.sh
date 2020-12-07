#!/usr/bin/env bash

ENV=${1:-"NONE"}


case "$ENV" in
  ("test"):
    cdk deploy MaintenanceTrackingRoadTest
#    cdk deploy --verbose MaintenanceTrackingRoadTest
  ;;
  ("prod"):
    cdk deploy MaintenanceTrackingRoadProd
#    cdk deploy --verbose MaintenanceTrackingRoadProd
  ;;
  (*) echo "Allowed parameter values are 'test' and 'prod'" ;;
esac
