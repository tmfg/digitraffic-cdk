#!/usr/bin/env bash

# Exit on any error
set -ex

yarn workspace digitraffic-common run build
./build_in.sh marine
./build_in.sh road
./build_in.sh aviation
./build_in.sh other
