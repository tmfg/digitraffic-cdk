#!/usr/bin/env bash

# exit on any error
set -ex

yarn workspace digitraffic-common run build
yarn workspace marine run build
yarn workspace road run build
yarn workspace other run build
