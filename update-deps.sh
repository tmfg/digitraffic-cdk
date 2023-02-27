#!/usr/bin/env bash

# Updates all project dependencies (for versioning conventions see CONVENTIONS.md)

# exit on any error
set -ex

rush update --full
