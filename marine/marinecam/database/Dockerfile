FROM flyway/flyway:10.19-alpine

ARG ENVIRONMENT=dev

COPY conf/$ENVIRONMENT /flyway/conf
COPY update /flyway/sql

ENTRYPOINT ["flyway"]
CMD ["-?"]
