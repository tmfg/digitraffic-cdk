#!/usr/bin/env bash

ENV=${1:-"NONE"}

#CloudfrontRoadTest
#CloudfrontRoadProd
#CloudfrontMarineTest
#CloudfrontMarineProd

echo "Install CloudFront for $ENV"

case "$ENV" in
  ("road-test"):
    . ../road/cdk-set-env-road-test.sh
    cdk deploy CloudfrontRoadTest
  ;;
  ("road-prod"):
    . ../road/cdk-set-env-road-prod.sh
    cdk deploy CloudfrontRoadProd
  ;;
  ("marine-test"):
    . ../marine/cdk-set-env-marine-test.sh
    cdk deploy CloudfrontMarineTest
  ;;
  ("marine-prod"):
    . ../marine/cdk-set-env-marine-prod.sh
    cdk deploy CloudfrontMarineProd
  ;;
  (*) echo "Allowed parameter values are 'road-test', 'road-prod', 'marine-test' and 'marine-prod'" ;;
esac
