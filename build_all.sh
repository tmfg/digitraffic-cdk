#!/usr/bin/env bash

# Exit on any error
set -ex

# Note: running 'yarn workspaces run build' ends up building every nested project twice

yarn workspace digitraffic-common run build
yarn workspace marine run build
yarn workspace road run build
yarn workspace other run build
