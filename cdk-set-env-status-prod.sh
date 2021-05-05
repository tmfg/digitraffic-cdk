#!/usr/bin/env bash

# Execute in shell:
# . cdk-set-env-test.sh

# Set test env
set -v
# AWS_PROFILE=fintraffic-digitraffic-<road|marine|rail|status>-<tst|prd>
AWS_PROFILE=fintraffic-digitraffic-status-prd
AWS_DEFAULT_REGION=eu-west-1
set +v