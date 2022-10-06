#!/usr/bin/env bash

# Exit on any error
set -ex

./build_in.sh marine
./build_in.sh road
./build_in.sh aviation
./build_in.sh other
