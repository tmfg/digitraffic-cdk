#!/usr/bin/env bash

ENV=${1:-"NONE"}

echo Start $(date +%Y-%m-%dT%H:%M:%S%z)
echo

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

# print installation time
echo
echo End $(date +%Y-%m-%dT%H:%M:%S%z)