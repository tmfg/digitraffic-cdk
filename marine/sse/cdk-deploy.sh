#!/usr/bin/env bash

ENV=${1:-"NONE"}

echo Start $(date +%Y-%m-%dT%H:%M:%S%z)
echo

case "$ENV" in
  ("test"):
    . ../cdk-set-env-marine-test.sh
    cdk deploy SseMarineTest
  ;;
  ("prod"):
    . ../cdk-set-env-marine-prod.sh
    cdk deploy SseMarineProd
  ;;
  (*) echo "Allowed parameter values are 'test' and 'prod'" ;;
esac

# print installation time
echo
echo End $(date +%Y-%m-%dT%H:%M:%S%z)