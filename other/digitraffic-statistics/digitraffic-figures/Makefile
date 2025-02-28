include .env
export

python := python3.11

DOCKER_COMPOSE := $(shell command -v docker-compose 2> /dev/null)
ifndef DOCKER_COMPOSE
	DOCKER_COMPOSE := docker compose
endif

create_venv:
	${python} -m venv venv
	venv/bin/python -V

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

build_docker:
	${DOCKER_COMPOSE} --file dbfigures/docker-compose.yml build

clean_docker:
	${DOCKER_COMPOSE} --file dbfigures/docker-compose.yml kill  && ${DOCKER_COMPOSE} --file dbfigures/docker-compose.yml rm

start_db:
	${DOCKER_COMPOSE} --file dbfigures/docker-compose.yml up -d db

dev: export FLASK_APP=digitraffic_figures
dev: export DEV=true
dev:
	venv/bin/flask run

build_container:
	docker build -t dt-figures .

clean: clean_venv clean_docker

install: start_db run_flyway create_venv install_venv

run_flyway:
	${DOCKER_COMPOSE} --file dbfigures/docker-compose.yml up flyway

csv_to_db:
	cat dbfigures/data/*.csv > combined.csv
	sed -e 's/\([^–]\)id,from,to,name,filter,query,value/\1/' < combined.csv > key_figures.csv
	rm combined.csv
	${DOCKER_COMPOSE} --file dbfigures/docker-compose.yml cp ./key_figures.csv db:/tmp/key_figures.csv 
	${DOCKER_COMPOSE} --file dbfigures/docker-compose.yml exec db mysql -u"${DB_USER}" -p"${DB_PASSWORD}" -e 'truncate key_figures;' ${DB_DATABASE}
	${DOCKER_COMPOSE} --file dbfigures/docker-compose.yml exec db sh -c "mysql -uroot -p'"${DB_PASSWORD}"' -e 'SET GLOBAL local_infile=1';"
	${DOCKER_COMPOSE} --file dbfigures/docker-compose.yml exec db sh -c "mysqlimport --ignore-lines=1 --fields-enclosed-by='"'"'"' --fields-terminated-by=',' --local=1 -uroot -p'"${DB_PASSWORD}"' ${DB_DATABASE} /tmp/key_figures.csv"
	rm key_figures.csv

insert_test_data:
	sed -e 's/\([^–]\)id,from,to,name,filter,query,value/\1/' < dbfigures/data/test/test_data.csv > key_figures.csv
	${DOCKER_COMPOSE} --file dbfigures/docker-compose.yml cp ./key_figures.csv db:/tmp/key_figures.csv 
	${DOCKER_COMPOSE} --file dbfigures/docker-compose.yml exec db mysql -u"${DB_USER}" -p"${DB_PASSWORD}" -e 'truncate key_figures;' ${DB_DATABASE}
	${DOCKER_COMPOSE} --file dbfigures/docker-compose.yml exec db sh -c "mysql -uroot -p'"${DB_PASSWORD}"' -e 'SET GLOBAL local_infile=1';"
	${DOCKER_COMPOSE} --file dbfigures/docker-compose.yml exec db sh -c "mysqlimport --ignore-lines=1 --fields-enclosed-by='"'"'"' --fields-terminated-by=',' --local=1 -uroot -p'"${DB_PASSWORD}"' ${DB_DATABASE} /tmp/key_figures.csv"
	rm key_figures.csv
