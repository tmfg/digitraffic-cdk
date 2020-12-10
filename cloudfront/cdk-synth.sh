#!/usr/bin/env bash

ENV=${1:-"NONE"}

#CloudfrontRoadTest
#CloudfrontRoadProd
#CloudfrontMarineTest
#CloudfrontMarineProd

echo "Diff CloudFront for $ENV"

case "$ENV" in
  ("road-test"):
    cdk synth CloudfrontRoadTest --no-staging > template-road-test.yaml
  ;;
  ("road-prod"):
    cdk synth CloudfrontRoadProd --no-staging > template-road-prod.yaml
  ;;
  ("marine-test"):
    cdk synth CloudfrontMarineTest --no-staging > template-marine-test.yaml
  ;;
  ("marine-prod"):
    cdk synth CloudfrontMarineProd --no-staging > template-marine-prod.yaml
  ;;
  (*) echo "Allowed parameter values are 'road-test', 'road-prod', 'marine-test' and 'marine-prod'" ;;
esac
