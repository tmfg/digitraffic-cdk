FROM flyway/flyway:11.3.1-alpine

ARG ENVIRONMENT=dev

COPY conf/$ENVIRONMENT /flyway/conf
COPY update /flyway/sql

ENTRYPOINT ["flyway"]
CMD ["-?"]
