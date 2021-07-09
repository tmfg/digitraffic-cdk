#!/usr/bin/env bash

#cdk synth SseMarineTest --no-staging > template.yaml

ENV=${1:-"NONE"}

case "$ENV" in
  ("test"):
    cdk synth SseMarineTest --no-staging > template-marine-test.yaml
  ;;
  ("prod"):
    cdk synth SseMarineProd --no-staging > template-marine-prod.yaml
  ;;
  (*) echo "Allowed parameter values are 'test' and 'prod'" ;;
esac