#!/usr/bin/env bash
# This is a little helper script to work with subtree through rush global commands. For more complex functionality,
# just run the commands directly.

REPO="digitraffic-common"
LIBPATH="lib/digitraffic-common"

# Check remote has been installed and is available.
if ! git remote -v | egrep -q "^$REPO	"; then
  echo "Remote $REPO not found. Add it with 'git remote add $REPO <url>'"
  exit 1
fi

cmd=""
refspec=""

# Rush doesn't support passing on positional arguments, so they need to be named here also.
while [[ $# -gt 0 ]]; do
  case $1 in
    -c|--cmd)
      cmd="$2"
      shift
      ;;
    -r|--refspec)
      refspec="$2"
      shift
      ;;
  esac
  shift
done

if [[ $cmd = "" ]]; then
  echo "-c parameter required"
  exit 1
fi
if [[ $refspec = "" ]]; then
  echo "-r parameter required"
  exit 1
fi

set -eux

case $cmd in
  "pull")
    git subtree pull --prefix="$LIBPATH" "$REPO" --squash "$refspec"
    ;;
  "push")
    git subtree push --prefix="$LIBPATH" "$REPO" "$refspec"
    ;;
  "diff")
    # Add remote and fetch what we want to diff against.
    git fetch "$REPO" "$refspec"
    git diff HEAD:"$LIBPATH" remotes/"$REPO"/"$refspec"
    ;;
  "subtree-add")
    git subtree add --prefix="$LIBPATH" "$REPO" "$refspec" --squash
    ;;
esac
