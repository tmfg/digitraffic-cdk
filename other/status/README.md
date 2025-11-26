# Digitraffic Status

Takes a OpenApi descriptions and creates a set of NodePing checks to monitor
them.

## Build and install command

    # Buildint
    rush update
    rushx test
    rushx build

    # Deploy
    rushx cdk-diff-status-prod
    rushx cdk-deploy-status-prod

## Lambdas

### [lambda-check-component-states.ts](src/lambda/check-component-states/lambda-check-component-states.ts)

Checks that statuspage and NodePing checks states are in sync. If they are not
in sync Lambda sends notification to Slack channel.

### [lambda-handle-maintenance.ts](src/lambda/handle-maintenance/lambda-handle-maintenance.ts)

Checks if there is active maintenances on status page and enables or disables
NodePing checks depending of the state. Also triggers statuspage to update
maintenance as started when turning off NodePing checks.

### [lambda-mqtt-proxy-healthcheck.ts](src/lambda/mqtt-proxy-healthcheck/lambda-mqtt-proxy-healthcheck.ts)

Works as a proxy between NodePing http check and MQTT service to get MQTT
status.

### [lambda-update-status.ts](src/lambda/update-status/lambda-update-status.ts)

Reads OpenApi descriptions from apps and creates or updates NodePing checks and
contacts.
