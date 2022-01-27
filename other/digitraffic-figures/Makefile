flask_app := digitraffic_figures
db_host := 127.0.0.1
db_user := key_figures
db_password := key_figures
db_port := 3306
db_database := key_figures
python := python3.9

create_venv:
	$(python) -m virtualenv venv

install_venv:
	venv/bin/pip install -r requirements.txt

clean_venv:
	rm -rf venv

list_outdated:
	venv/bin/pip list --outdated

update_outdated:
	venv/bin/pip list --outdated --format=freeze | cut -d"=" -f 1 | xargs -I"{}" venv/bin/pip install -U "{}"

freeze_venv:
	venv/bin/pip freeze > requirements.txt

clean_docker:
	cd dbfigures && docker compose kill && docker compose rm -f

csv_to_db:
	cat data/key_figures/*.csv > combined.csv
	sed -e 's/\([^–]\)id,from,to,name,filter,query,value/\1/' < combined.csv > dbfigures/key_figures.csv
	rm combined.csv
	cd dbfigures \
		&& docker compose cp ./key_figures.csv db:/tmp/key_figures.csv \
		&& docker compose exec db mysql -u"${db_user}" -p"${db_password}" -e 'truncate key_figures;' ${db_database} \
		&& docker compose exec db sh -c "mysql -uroot -p'"${db_password}"' -e 'SET GLOBAL local_infile=1';" \
		&& docker compose exec db sh -c "mysqlimport --ignore-lines=1 --fields-enclosed-by='"'"'"' --fields-terminated-by=',' --local=1 -uroot -p'"${db_password}"' ${db_database} /tmp/key_figures.csv"
	rm dbfigures/key_figures.csv

start_db:
	cd dbfigures && docker compose up -d

run: export FLASK_APP=${flask_app}
run:
	venv/bin/flask run

dev: export FLASK_APP=${flask_app}
dev: export FLASK_ENV=development
dev: export DB_HOST=${db_host}
dev: export DB_PORT=${db_port}
dev: export DB_DATABASE=${db_database}
dev: export DB_USERNAME=${db_user}
dev: export DB_PASSWORD=${db_password}
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
