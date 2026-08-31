FROM flyway/flyway:13.3.0-alpine@sha256:fb13953f16913efd313f202ec4b4ed34fd2ea14cc51401eb36ea9818c0df2918

ARG ENVIRONMENT=dev

COPY conf/$ENVIRONMENT /flyway/conf
COPY update /flyway/sql

ENTRYPOINT ["flyway"]
CMD ["-?"]
