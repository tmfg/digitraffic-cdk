#!/usr/bin/env bash

# Execute in shell:
# . cdk-set-env-test.sh

# Set test env
set -v
export AWS_PROFILE=digitraffic-road-test
export AWS_DEFAULT_REGION=eu-west-1
set +v