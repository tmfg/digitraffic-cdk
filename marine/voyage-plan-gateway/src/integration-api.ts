import type { LambdaEnvironment } from "@digitraffic/common/dist/aws/infra/stack/lambda-configs";
import { defaultLambdaConfiguration } from "@digitraffic/common/dist/aws/infra/stack/lambda-configs";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { createRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { createUsagePlan } from "@digitraffic/common/dist/aws/infra/usage-plans";
import {
    GatewayResponse,
    LambdaIntegration,
    PassthroughBehavior,
    type Resource,
    ResponseType
} from "aws-cdk-lib/aws-apigateway";
import { AssetCode } from "aws-cdk-lib/aws-lambda";
import type { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import type { Topic } from "aws-cdk-lib/aws-sns";
import type { VoyagePlanGatewayProps } from "./app-props.js";
import { VoyagePlanEnvKeys } from "./keys.js";

export function create(
    secret: ISecret,
    notifyTopic: Topic,
    props: VoyagePlanGatewayProps,
    stack: DigitrafficStack
): void {
    const integrationApi = createRestApi(stack, "VPGW-Integration", "VPGW integration API");
    // set response for missing auth token to 501 as desired by API registrar
    new GatewayResponse(stack, "MissingAuthenticationTokenResponse", {
        restApi: integrationApi,
        type: ResponseType.MISSING_AUTHENTICATION_TOKEN,
        statusCode: "501",
        templates: {
            "application/json": "Not implemented"
        }
    });
    // eslint-disable-next-line deprecation/deprecation
    createUsagePlan(integrationApi, "VPGW CloudFront API Key", "VPGW Faults CloudFront Usage Plan");
    const resource = integrationApi.root.addResource("vpgw");
    createNotifyHandler(secret, stack, notifyTopic, resource, props);
}

function createNotifyHandler(
    secret: ISecret,
    stack: DigitrafficStack,
    notifyTopic: Topic,
    api: Resource,
    props: VoyagePlanGatewayProps
): void {
    const handler = createHandler(stack, notifyTopic, props);
    secret.grantRead(handler);
    const resource = api.addResource("notify");
    createIntegrationResource(resource, handler);
}

function createIntegrationResource(resource: Resource, handler: MonitoredFunction): void {
    const integration = new LambdaIntegration(handler, {
        proxy: true,
        integrationResponses: [{ statusCode: "204" }],
        passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH // because of proxy type integration
    });

    resource.addMethod("POST", integration, {
        apiKeyRequired: true,
        methodResponses: [{ statusCode: "204" }]
    });
}

function createHandler(
    stack: DigitrafficStack,
    notifyTopic: Topic,
    props: VoyagePlanGatewayProps
): MonitoredFunction {
    const functionName = "VPGW-Notify";
    const environment: LambdaEnvironment = {};
    environment[VoyagePlanEnvKeys.TOPIC_ARN] = notifyTopic.topicArn;

    const handler = MonitoredFunction.create(
        stack,
        functionName,
        defaultLambdaConfiguration({
            functionName,
            code: new AssetCode("dist/lambda/notify"),
            handler: "lambda-notify.handler",
            timeout: 10,
            reservedConcurrentExecutions: 1,
            environment
        })
    );
    notifyTopic.grantPublish(handler);

    return handler;
}
