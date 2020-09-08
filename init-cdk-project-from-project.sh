#!/bin/bash

FROM_PROJECT_PATH=${1?Project path to use as the base is a required parameter. Ie. marine/portcall-estimates}
TO_PROJECT_PATH=${2?New project paht is a required parameter. Ie. road/maintenance-tracking}

FROM_PROJECT_PATH=${FROM_PROJECT_PATH%/} # Removes possible trailing slash
TO_PROJECT_PATH=${TO_PROJECT_PATH%/} # Removes possible trailing slash

FROM_BASE_DIR="$(dirname "${FROM_PROJECT_PATH}")/" # Base dir ie. marine or road
FROM_PROJECT_NAME=`basename "${FROM_PROJECT_PATH}"` # Source project name

TO_BASE_DIR="$(dirname "${TO_PROJECT_PATH}")/" # Base dir ie. marine or road
TO_PROJECT_NAME=`basename "${TO_PROJECT_PATH}"` # New project name

echo FROM_BASE_DIR: ${FROM_BASE_DIR}
echo FROM_PROJECT_NAME: ${FROM_PROJECT_NAME}

echo TO_BASE_DIR: ${TO_BASE_DIR}
echo TO_PROJECT_NAME: ${TO_PROJECT_NAME}

# Resolve sed version if OS X (BSD or GNU)
GSED=true
OS=`uname -s`
if [[ $OS == "Darwin" ]]; then
    VERSION=$(sed --version 2>&1 | head -1)
    if [[ "${VERSION}" != *"GNU"* ]]; then
        echo "Using BSD sed on OS X"
        GSED=false
    else
        echo "Using GNU sed on OS X"
    fi
fi

if [ ! -d "${FROM_PROJECT_PATH}" ]; then
  echo
  echo "Source project directory ${FROM_PROJECT_PATH} doesn't exists."
  echo "Exit without any modifications"
  exit 1 # handle exits from shell or function but don't exit interactive shell
fi

if [ -d "${TO_PROJECT_PATH}" ]; then
  echo
  echo "New project directory ${TO_PROJECT_PATH} already exists."
  echo "Are you sure you want to generate initial directory structure for it anyway?"
  echo "It is safe as nothing is deleted only non existing directories/files are created."
  echo
  read -p "Continue creating initial directory structure? [y/n] " -n 1 -r
  echo    # (optional) move to a new line
  if [[ ! $REPLY =~ ^[Yy]$ ]]
  then
    echo "Exit without any modifications"
    exit 1 # handle exits from shell or function but don't exit interactive shell
  fi
fi

echo
echo "Copy contents from  ${FROM_PROJECT_PATH} to ${TO_PROJECT_PATH}"
# recursive, do not overwrite, verbose
cp -r -n -v "${FROM_PROJECT_PATH}/" "${TO_PROJECT_PATH}"
mkdir -p "${TO_PROJECT_PATH}/bin"
echo "Copy contents done!"

echo
echo "Replace ${FROM_PROJECT_NAME} to ${TO_PROJECT_NAME} inside files"
if $GSED; then
  echo "Running GNU sed"
  find ${TO_PROJECT_PATH} -type f -exec sed -i 's/'"${FROM_PROJECT_NAME}"'/'"${TO_PROJECT_NAME}"'/g' {} +
else
  echo "Running BSD sed"
  find ${TO_PROJECT_PATH} -type f -exec sed  -i '' 's/'"${FROM_PROJECT_NAME}"'/'"${TO_PROJECT_NAME}"'/g' {} +
fi
echo "Replace done!"

echo
echo "Rename filenames containing ${FROM_PROJECT_NAME} to ${TO_PROJECT_NAME}"
find "${TO_PROJECT_PATH}" -name '*'"${FROM_PROJECT_NAME}"'*' | rename -v "s/${FROM_PROJECT_NAME}/${TO_PROJECT_NAME}/g"
echo "Rename done!"

echo "TODO: Project base is copied from ${FROM_PROJECT_PATH}." > "${TO_PROJECT_PATH}/TODO.txt"
echo "Go through the files and do required modifications." > "${TO_PROJECT_PATH}/TODO.txt"

echo
