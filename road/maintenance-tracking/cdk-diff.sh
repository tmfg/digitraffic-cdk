#!/usr/bin/env bash

ENV=${1:-"NONE"}

case "$ENV" in
  ("test"):
    cdk diff MaintenanceTrackingRoadTest
  ;;
  ("prod"):
    cdk diff MaintenanceTrackingRoadProd
  ;;
  (*) echo "Allowed parameter values are 'test' and 'prod'" ;;
esac
