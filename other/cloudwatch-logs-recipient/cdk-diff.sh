#!/usr/bin/env bash

ENV=${1:-"NONE"}

echo "Diff CloudWatchLogsRecipient for $ENV"

case "$ENV" in
  ("status-test"):
    . ../cdk-set-env-status-test.sh
    cdk diff CloudWatchLogsRecipientTest
  ;;
  ("status-prod"):
    . ../cdk-set-env-status-prod.sh
    cdk diff CloudWatchLogsRecipientProd
  ;;
  (*) echo "Allowed parameter values are 'status-test', 'status-prod'" ;;
esac
