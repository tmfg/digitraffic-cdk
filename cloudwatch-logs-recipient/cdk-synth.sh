#!/usr/bin/env bash

ENV=${1:-"NONE"}

echo "Diff CloudWatchLogsRecipient for $ENV"

case "$ENV" in
  ("status-test"):
    cdk synth CloudWatchLogsRecipientTest --no-staging > template-status-test.yaml
  ;;
  ("status-prod"):
    cdk synth CloudWatchLogsRecipientPRod --no-staging > template-status-prod.yaml
  ;;
  (*) echo "Allowed parameter values are 'status-test', 'status-prod'" ;;
esac
