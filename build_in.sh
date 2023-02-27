#!/usr/bin/env bash

# Exit on any error
set -e

rush build --to $1
