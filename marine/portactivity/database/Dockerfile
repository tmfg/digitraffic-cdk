FROM flyway/flyway:13.12.2-alpine@sha256:f5b9740a05ef38fc31356dcf2e7796dafc693ea289546e82c7699d37f83349af

ARG ENVIRONMENT=dev

COPY conf/$ENVIRONMENT /flyway/conf
COPY update /flyway/sql

ENTRYPOINT ["flyway"]
CMD ["-?"]
