#!/bin/bash

FROM_PROJECT_PATH=${1?Project path to use as the base is a required parameter. Ie. marine/portcall-estimates}
TO_PROJECT_PATH=${2?New project path is a required parameter. Ie. road/maintenance-tracking}

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

SED_CMD=
echo
echo "Trying to find GNU sed installation"
for i in `find /bin /usr/bin /usr/local -type f -name "*sed" 2>/dev/null`; do
  echo "Checking GNU sed: $i"
  RETVAL=$($i --version 2>/dev/null)
  EXIT_CODE=$?
  if [ $EXIT_CODE -eq 0 ]; then # GNU sed
    SED_CMD=$i
    break;
  fi
done

if [[ $SED_CMD == "" ]]; then # GNU sed
  echo
  echo "No GNU sed found. Install it and then rerun the script."
  echo
  exit 1;
fi
echo
echo "Using GNU sed: $SED_CMD"

# Usage: findAndReplace '<FindString>' '<ReplaceString>'
## Example: findAndReplace 'OldString' 'NewString'
findAndReplace() {
  FROM=$1
  TO=$2
  echo
  echo "Replace \"${FROM}\" to \"${TO}\" inside project files"
  find ${TO_PROJECT_PATH} -type f ! -path '*/node_modules/*' ! -path '*/cdk.out/*' -exec "$SED_CMD" -i 's/'"${FROM}"'/'"${TO}"'/g' {} +
}

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

findAndReplace "${FROM_PROJECT_NAME}" "${TO_PROJECT_NAME}"
FROM_PROJECT_NAME_CAMEL=$(echo "${FROM_PROJECT_NAME}" | "$SED_CMD" -E "s~(^|-)(.)~\U\2~g")
TO_PROJECT_NAME_CAMEL=$(echo "${TO_PROJECT_NAME}" | "$SED_CMD" -E "s~(^|-)(.)~\U\2~g")
findAndReplace "${FROM_PROJECT_NAME_CAMEL}" "${TO_PROJECT_NAME_CAMEL}"

# First not camel StartEnd -> startEnd
FROM_PROJECT_NAME_FUNCTION=$(echo "${FROM_PROJECT_NAME_CAMEL}" | "$SED_CMD" -E "s~(^.)~\L\1~g")
TO_PROJECT_NAME_FUNCTION=$(echo "${TO_PROJECT_NAME_CAMEL}" |  "$SED_CMD" -E "s~(^.)~\L\1~g")
findAndReplace "${FROM_PROJECT_NAME_FUNCTION}" "${TO_PROJECT_NAME_FUNCTION}"

findAndReplace "${FROM_PROJECT_NAME_CAMEL}" "${TO_PROJECT_NAME_CAMEL}"

if [ "${FROM_BASE_DIR}" != "${TO_BASE_DIR}" ]; then
  FROM_BASE_DIR_CAMEL=$(echo "${FROM_BASE_DIR%/}" | "$SED_CMD" -E "s~(^|-)(.)~\U\2~g")
  TO_BASE_DIR_CAMEL=$(echo "${TO_BASE_DIR%/}" | "$SED_CMD" -E "s~(^|-)(.)~\U\2~g")
  findAndReplace "${FROM_BASE_DIR%/}" "${TO_BASE_DIR%/}"
  findAndReplace "${FROM_BASE_DIR_CAMEL}" "${TO_BASE_DIR_CAMEL}"
fi

# Remove - and then Uppercase all first letters of the words
FROM_PROJECT_NAME_UPPER=$(echo "${FROM_PROJECT_NAME}" | "$SED_CMD" -E 's/-/ /g' | "$SED_CMD" -E 's/\b(.)/\u\1/g')
TO_PROJECT_NAME_UPPER=$(echo "${TO_PROJECT_NAME}" | "$SED_CMD" -E 's/-/ /g' | "$SED_CMD" -E 's/\b(.)/\u\1/g')
findAndReplace "${FROM_PROJECT_NAME_UPPER}" "${TO_PROJECT_NAME_UPPER}"

# Remove - and then Uppercase only first letter on line
FROM_PROJECT_NAME_UPPER=$(echo "${FROM_PROJECT_NAME}" | "$SED_CMD" -E 's/-/ /g' | "$SED_CMD" -E "s~(^.)~\U\1~g" )
TO_PROJECT_NAME_UPPER=$(echo "${TO_PROJECT_NAME}" | "$SED_CMD" -E 's/-/ /g' | sed -E "s~(^.)~\U\1~g")
findAndReplace "${FROM_PROJECT_NAME_UPPER}" "${TO_PROJECT_NAME_UPPER}"

echo "Replace done!"

echo
echo "Rename filenames containing ${FROM_PROJECT_NAME} to ${TO_PROJECT_NAME}"
find "${TO_PROJECT_PATH}" -name '*'"${FROM_PROJECT_NAME}"'*' | rename -v "s/${FROM_PROJECT_NAME}/${TO_PROJECT_NAME}/g"
echo "Rename done!"

echo "TODO: Project base is copied from ${FROM_PROJECT_PATH}." >> "${TO_PROJECT_PATH}/TODO.txt"
echo "TODO: Go through the files and do required modifications." >> "${TO_PROJECT_PATH}/TODO.txt"

echo

echo "All done. Open new project at ${TO_PROJECT_PATH}"