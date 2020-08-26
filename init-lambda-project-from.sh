#!/bin/bash

LAMBDA_FROM=${1?Lambda from is a required parameter. Ie. variable-signs}
LAMBDA=${2?Lambda name is a required parameter. Ie. maintenance-tracking}

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

if [ ! -d "${LAMBDA_FROM}" ]; then
  echo
  echo "Source lambda project directory ${LAMBDA_FROM} doesn't exists."
  echo "Exit without any modifications"
  exit 1 # handle exits from shell or function but don't exit interactive shell
fi

if [ -d "${LAMBDA}" ]; then
  echo
  echo "Lambda project directory ${LAMBDA} already exists."
  echo "Are you sure you want to generate initial directory structure for it anyway?"
  echo "It is safe as nothing is deleted only not existing directories are created."
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
echo "Copy contents from  ${LAMBDA_FROM} to ${LAMBDA}"
# recursive, do not overwrite, verbose
cp -r -n -v "${LAMBDA_FROM}/" "${LAMBDA}"
echo "Copy contents done!"

echo
echo "Replace ${LAMBDA_FROM} to ${LAMBDA} inside files"
if $GSED; then
  echo "Running GNU sed"
  find ${LAMBDA} -type f -exec sed -i 's/'"${LAMBDA_FROM}"'/'"${LAMBDA}"'/g' {} +
else
  echo "Running BSD sed"
  find ${LAMBDA} -type f -exec sed  -i '' 's/'"${LAMBDA_FROM}"'/'"${LAMBDA}"'/g' {} +
fi
echo "Replace done!"

echo
echo "Rename filenames containing ${LAMBDA_FROM} to ${LAMBDA}"
find "${LAMBDA}" -name '*'"${LAMBDA_FROM}"'*' | rename -v "s/${LAMBDA_FROM}/${LAMBDA}/g"
echo "Rename done!"

echo
