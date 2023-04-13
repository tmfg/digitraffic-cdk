ARG FUNCTION_DIR="/function"

ARG PYTHON_VERSION=3.11

FROM arm64v8/python:${PYTHON_VERSION}-slim as build-image

RUN apt-get update \
    && apt-get install -y \
    build-essential libcurl4-openssl-dev default-libmysqlclient-dev

ARG FUNCTION_DIR

RUN mkdir -p ${FUNCTION_DIR}
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt --target ${FUNCTION_DIR}
RUN pip install --no-cache-dir --target ${FUNCTION_DIR} awslambdaric

FROM arm64v8/python:${PYTHON_VERSION}-slim

ARG FUNCTION_DIR

RUN apt-get update && apt-get install -y \
    default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR ${FUNCTION_DIR}

COPY --from=build-image ${FUNCTION_DIR} ${FUNCTION_DIR}
COPY digitraffic_figures ${FUNCTION_DIR}/digitraffic_figures
COPY app.py ${FUNCTION_DIR}

RUN python -m compileall .

ENTRYPOINT [ "/usr/local/bin/python", "-m", "awslambdaric" ]
CMD [ "app.handler" ]
