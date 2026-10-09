FROM flyway/flyway:13.9.0-alpine@sha256:ae8e985a8caf73181a39aad823690f27d55c850d4c5cea92a94c0ce4b3943156

ARG ENVIRONMENT=dev

COPY conf/$ENVIRONMENT /flyway/conf
COPY update /flyway/sql

ENTRYPOINT ["flyway"]
CMD ["-?"]
