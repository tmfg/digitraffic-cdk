include .env
export

python := python3

DOCKER_COMPOSE := $(shell command -v docker-compose 2> /dev/null)
ifndef DOCKER_COMPOSE
  DOCKER_COMPOSE := docker compose
endif

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
