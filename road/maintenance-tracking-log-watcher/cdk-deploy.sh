#!/usr/bin/env bash

ENV=${1:-"NONE"}

case "$ENV" in
  ("test"):
    . ../../cdk-set-env-status-test.sh
    cdk deploy MaintenanceTrackingLogWatcherTest
  ;;
  ("prod"):
    . ../../cdk-set-env-status-prod.sh
    cdk deploy MaintenanceTrackingLogWatcherProd
  ;;
  (*) echo "Allowed parameter values are 'test' and 'prod'" ;;
esac
