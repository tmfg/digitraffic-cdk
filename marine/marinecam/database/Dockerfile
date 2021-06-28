FROM flyway/flyway:7.10-alpine

ARG ENVIRONMENT=dev

COPY conf/$ENVIRONMENT /flyway/conf
COPY update /flyway/sql

ENTRYPOINT ["flyway"]
CMD ["-?"]