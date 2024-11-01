import type { LambdaEnvironment } from "@digitraffic/common/dist/aws/infra/stack/lambda-configs";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { createIpRestrictionPolicyDocument } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import { TrafficType } from "@digitraffic/common/dist/types/traffictype";
import { Duration, type Stack } from "aws-cdk-lib";
import {
    EndpointType,
    LambdaIntegration,
    MethodLoggingLevel,
    type Resource,
    RestApi
} from "aws-cdk-lib/aws-apigateway";
import { AssetCode, Runtime } from "aws-cdk-lib/aws-lambda";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import type { ITopic } from "aws-cdk-lib/aws-sns";
import type { Construct } from "constructs";
import type { Props } from "./app-props.js";
import { KEY_APP } from "./lambda/mqtt-proxy-healthcheck/lambda-mqtt-proxy-healthcheck.js";

export function create(stack: Stack, alarmSnsTopic: ITopic, warningSnsTopic: ITopic, props: Props): void {
    const api = createApi(stack, props.allowFromIpAddresses);

    const resource = api.root.addResource("healthcheck-proxy");

    createMqttProxyResource(resource, "Meri", alarmSnsTopic, warningSnsTopic, stack);
    createMqttProxyResource(resource, "Tie", alarmSnsTopic, warningSnsTopic, stack);
}

function createApi(stack: Construct, allowFromIpAddresses: string[]): RestApi {
    return new RestApi(stack, "HC-Proxy", {
        endpointExportName: "HC-Proxy",
        deployOptions: {
            loggingLevel: MethodLoggingLevel.ERROR
        },
        restApiName: "Healthcheck Proxy API",
        endpointTypes: [EndpointType.REGIONAL],
        policy: createIpRestrictionPolicyDocument(allowFromIpAddresses)
    });
}

function createMqttProxyResource(
    resource: Resource,
    app: string,
    alarmSnsTopic: ITopic,
    warningSnsTopic: ITopic,
    stack: Stack
): MonitoredFunction {
    const functionName = `Status-MqttProxy${app}`;

    const assetCode = new AssetCode("dist/lambda/mqtt-proxy-healthcheck");

    const env: LambdaEnvironment = {};
    env[KEY_APP] = app.toLowerCase();

    const lambda = new MonitoredFunction(
        stack,
        functionName,
        {
            functionName,
            code: assetCode,
            handler: "lambda-mqtt-proxy-healthcheck.handler",
            runtime: Runtime.NODEJS_20_X,
            reservedConcurrentExecutions: 1,
            timeout: Duration.seconds(10),
            memorySize: 128,
            environment: env,
            logRetention: RetentionDays.ONE_YEAR
        },
        alarmSnsTopic,
        warningSnsTopic,
        true,
        TrafficType.OTHER
    );

    const integration = new LambdaIntegration(lambda, {
        proxy: true
    });

    const mqttProxyResource = resource.addResource(`${app.toLowerCase()}-mqtt`);
    mqttProxyResource.addMethod("GET", integration);

    return lambda;
}
