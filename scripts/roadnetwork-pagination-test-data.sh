#!/usr/bin/env bash

set -euo pipefail

BASE_PREFIX="releases"
BUCKET=${ROADNETWORK_TEST_BUCKET:?Set ROADNETWORK_TEST_BUCKET to the test bucket name}
EXPECTED_ACCOUNT=${ROADNETWORK_TEST_ACCOUNT:?Set ROADNETWORK_TEST_ACCOUNT to the expected AWS account ID}
DUMMY_FILES=(
  "roadnetwork-pagination-test-data.txt"
  "roadnetwork-pagination-test-readme.txt"
  "roadnetwork-pagination-test-metadata.txt"
)

usage() {
  cat <<EOF
Usage: $0 <create|delete>

Creates or deletes temporary Road Network pagination test data in:
  s3://${BUCKET}/${BASE_PREFIX}/2020_03 ... 2024_04/

The delete operation removes only the three files created by this script.
EOF
}

if [[ $# -ne 1 || ("$1" != "create" && "$1" != "delete") ]]; then
  usage >&2
  exit 2
fi

account=$(aws sts get-caller-identity --query Account --output text)
if [[ "${account}" != "${EXPECTED_ACCOUNT}" ]]; then
  echo "Refusing to continue in AWS account ${account}; expected ${EXPECTED_ACCOUNT}." >&2
  exit 1
fi

generate_folders() {
  local index year month
  for index in {0..49}; do
    year=$((2020 + index / 12))
    month=$((3 + index % 12))
    if (( month > 12 )); then
      year=$((year + 1))
      month=$((month - 12))
    fi
    printf '%04d_%02d\n' "$year" "$month"
  done
}

create_data() {
  local folder file content
  while read -r folder; do
    for file in "${DUMMY_FILES[@]}"; do
      content="Temporary pagination test data: ${folder}/${file}"
      printf '%s\n' "$content" | aws s3 cp - "s3://${BUCKET}/${BASE_PREFIX}/${folder}/${file}"
    done
  done < <(generate_folders)
}

delete_data() {
  local folder file key
  read -r -p "Delete only pagination test files from s3://${BUCKET}/${BASE_PREFIX}/? [y/N] " answer
  [[ "$answer" == "y" || "$answer" == "Y" ]] || {
    echo "Cancelled."
    exit 0
  }

  while read -r folder; do
    for file in "${DUMMY_FILES[@]}"; do
      key="${BASE_PREFIX}/${folder}/${file}"
      aws s3 rm "s3://${BUCKET}/${key}"
    done
  done < <(generate_folders)
}

case "$1" in
  create)
    create_data
    echo "Created pagination test data in 50 folders."
    ;;
  delete)
    delete_data
    echo "Deleted pagination test files."
    ;;
esac
