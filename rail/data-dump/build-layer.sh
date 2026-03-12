#!/bin/bash
# Build the Lambda layer zip with Python dependencies.
# Installs packages into python/ directory structure required by AWS Lambda layers.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAYER_DIR="$SCRIPT_DIR/layers"
ZIP_FILE="$LAYER_DIR/data-dump-deps.zip"
WORK_DIR="$(mktemp -d)"

trap 'rm -rf "$WORK_DIR"' EXIT

echo "Creating virtual environment..."
python3 -m venv "$WORK_DIR/venv"
source "$WORK_DIR/venv/bin/activate"

echo "Installing dependencies into layer..."
pip install --quiet --target "$WORK_DIR/python/" -r "$LAYER_DIR/requirements.txt"

deactivate

echo "Creating layer zip..."
mkdir -p "$LAYER_DIR"
(cd "$WORK_DIR" && zip -r -q "$ZIP_FILE" python/)

echo "Layer built: $ZIP_FILE ($(du -h "$ZIP_FILE" | cut -f1))"
