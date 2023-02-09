while read line; do
  requirement=$(sed "s/^\(.*\)==.*$/\1/g" <<<"$line")
  echo "Updating $requirement..."
  pip3 install --upgrade $requirement
done <requirements.txt

pip3 freeze > requirements.txt