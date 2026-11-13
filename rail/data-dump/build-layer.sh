#!/bin/bash
# Build the Lambda layer zip with Python dependencies.
# Installs packages into python/ directory structure required by AWS Lambda layers.
# Dependencies are exported from pyproject.toml using Poetry.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAYER_DIR="$SCRIPT_DIR/layers"
ZIP_FILE="$LAYER_DIR/data-dump-deps.zip"
WORK_DIR="$(mktemp -d)"
PYTHON_BIN="${PYTHON_BIN:-}"

if [ -z "$PYTHON_BIN" ]; then
	if command -v python3.12 >/dev/null 2>&1; then
		PYTHON_BIN="python3.12"
	else
		PYTHON_BIN="python3"
	fi
fi

if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
	echo "Python interpreter '$PYTHON_BIN' not found. Install Python 3.12 or set PYTHON_BIN to its executable path." >&2
	exit 1
fi

PYTHON_VERSION=$("$PYTHON_BIN" -c 'import sys; print("%d.%d" % sys.version_info[:2])')
if [ "$PYTHON_VERSION" != "3.12" ]; then
	echo "Python 3.12 is required to build the Lambda dependency layer; found $PYTHON_VERSION from $PYTHON_BIN" >&2
	exit 1
fi

trap 'rm -rf "$WORK_DIR"' EXIT

echo "Installing Poetry dependencies (ensures export plugin is available)..."
poetry install --directory="$SCRIPT_DIR" --quiet

echo "Exporting dependencies from Poetry..."
poetry export --only=main --without-hashes -f requirements.txt -o "$WORK_DIR/requirements.txt" --directory="$SCRIPT_DIR"

echo "Python libraries to include in layer:"
cat "$WORK_DIR/requirements.txt"

echo "Creating virtual environment..."
"$PYTHON_BIN" -m venv "$WORK_DIR/venv"
source "$WORK_DIR/venv/bin/activate"

echo "Installing dependencies into layer..."
# Upgrade pip to a version at least 7 days old, matching the cooldown policy from update-deps.sh
# Pin to 26.0 (released ~June 19, 2026, within 7-day cooldown as of June 26)
pip install --quiet --upgrade "pip>=26.0,<27"
pip install --quiet --target "$WORK_DIR/python/" -r "$WORK_DIR/requirements.txt"

if [ -z "$(find "$WORK_DIR/python/" -type f -print -quit)" ]; then
	echo "No Python dependencies were installed into the Lambda layer" >&2
	exit 1
fi

deactivate

echo "Creating layer zip..."
mkdir -p "$LAYER_DIR"
(cd "$WORK_DIR" && zip -r -q "$ZIP_FILE" python/)

echo "Layer built: $ZIP_FILE ($(du -h "$ZIP_FILE" | cut -f1))"
