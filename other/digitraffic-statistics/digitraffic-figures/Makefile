include .env

python := python3.11

create_venv:
	$(python) -m venv venv

install_venv:
	venv/bin/pip install -r requirements.txt
	venv/bin/python -m pip install --upgrade pip

clean_venv:
	rm -rf venv

list_outdated:
	venv/bin/pip list --outdated

update_outdated:
	venv/bin/python -m pip install --upgrade pip
	venv/bin/pip list --outdated --format=json | jq -r '.[].name' | xargs -I"{}" venv/bin/pip install -U "{}"

freeze_venv:
	venv/bin/pip freeze > requirements.txt

clean_docker:
	${docker_compose} kill && ${docker_compose} rm -f

csv_to_db:
	${docker_compose} create flyway
	${docker_compose} run --rm flyway
	cat data/key_figures/*.csv > combined.csv
	sed -e 's/\([^–]\)id,from,to,name,filter,query,value/\1/' < combined.csv > key_figures.csv
	rm combined.csv
	${docker_compose} cp ./key_figures.csv db:/tmp/key_figures.csv
	${docker_compose} exec db mysql -u"${DB_USER}" -p"${DB_PASSWORD}" -e 'truncate key_figures;' ${DB_DATABASE}
	${docker_compose} exec db sh -c "mysql -uroot -p'"${DB_PASSWORD}"' -e 'SET GLOBAL local_infile=1';"
	${docker_compose} exec db sh -c "mysqlimport --ignore-lines=1 --fields-enclosed-by='"'"'"' --fields-terminated-by=',' --local=1 -uroot -p'"${DB_PASSWORD}"' ${DB_DATABASE} /tmp/key_figures.csv"
	rm key_figures.csv

start_db:
	${docker_compose} up -d db

dev: export FLASK_APP=digitraffic_figures
run:
	venv/bin/flask run

dev: export FLASK_APP=digitraffic_figures
dev: export DEV=true
dev:
	venv/bin/flask run

build_container:
	docker build -t dt-figures .

push_container:
	docker tag dt-figures:latest ${DOCKER_REPOSITORY}/digitraffic-figures:latest
	docker push ${DOCKER_REPOSITORY}/digitraffic-figures:latest

build_insight_container:
	docker build -t dt-figures:latest-insight -f Dockerfile_insight .

push_insight_container:
	docker tag dt-figures:latest-insight ${DOCKER_REPOSITORY}/digitraffic-figures:latest-insight
	docker push ${DOCKER_REPOSITORY}/digitraffic-figures:latest-insight

build_lambda:
	mkdir -p out
	rm -f out/package.zip
	zip out/package.zip app.py
	zip out/package.zip digitraffic_figures
	cd venv/lib/${python}/site-packages \
		&& zip -r ../../../../out/package.zip . -x \*.pyc -x \*\*/__pycache__/\* -x \*\*/tests/\* -x \*tests.py -x \*\*/testing/\* -x \*\*/test/\*

build: install_venv build_lambda

clean: clean_venv clean_docker

install: start_db create_venv install_venv csv_to_db
