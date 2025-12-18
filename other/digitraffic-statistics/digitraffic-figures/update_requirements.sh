while read line; do
  requirement=$(sed "s/^\(.*\)==.*$/\1/g" <<<"$line")
  echo "Updating $requirement..."
  pip3 install --only-binary=:all: --upgrade $requirement
done <requirements.txt

pip3 freeze > requirements.txt