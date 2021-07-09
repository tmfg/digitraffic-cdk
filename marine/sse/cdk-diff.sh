#!/usr/bin/env bash

ENV=${1:-"NONE"}

case "$ENV" in
  ("test"):
    . ../cdk-set-env-marine-test.sh
    cdk diff SseMarineTest
  ;;
  ("prod"):
    . ../cdk-set-env-marine-prod.sh
    cdk diff SseMarineProd
  ;;
  (*) echo "Allowed parameter values are 'test' and 'prod'" ;;
esac
