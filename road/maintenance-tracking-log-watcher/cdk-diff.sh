#!/usr/bin/env bash

ENV=${1:-"NONE"}

case "$ENV" in
  ("test"):
    . ../../cdk-set-env-status-test.sh
    cdk diff MaintenanceTrackingLogWatcherTest
  ;;
  ("prod"):
    . ../../cdk-set-env-status-prod.sh
    cdk diff MaintenanceTrackingLogWatcherProd
  ;;
  (*) echo "Allowed parameter values are 'test' and 'prod'" ;;
esac
