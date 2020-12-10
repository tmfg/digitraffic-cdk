#!/usr/bin/env bash

ENV=${1:-"NONE"}

#CloudfrontRoadTest
#CloudfrontRoadProd
#CloudfrontMarineTest
#CloudfrontMarineProd

echo "Diff CloudFront for $ENV"

case "$ENV" in
  ("road-test"):
    . ../road/cdk-set-env-road-test.sh
    cdk diff CloudfrontRoadTest
  ;;
  ("road-prod"):
    . ../road/cdk-set-env-road-prod.sh
    cdk diff CloudfrontRoadProd
  ;;
  ("marine-test"):
    . ../marine/cdk-set-env-marine-test.sh
    cdk diff CloudfrontMarineTest
  ;;
  ("marine-prod"):
    . ../marine/cdk-set-env-marine-prod.sh
    cdk diff CloudfrontMarineProd
  ;;
  (*) echo "Allowed parameter values are 'road-test', 'road-prod', 'marine-test' and 'marine-prod'" ;;
esac
