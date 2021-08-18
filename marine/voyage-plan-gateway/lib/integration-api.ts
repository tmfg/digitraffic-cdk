import {
    GatewayResponse,
    LambdaIntegration,
    PassthroughBehavior,
    Resource,
    ResponseType,
} from '@aws-cdk/aws-apigateway';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {Construct} from "@aws-cdk/core";
import {createSubscription} from "digitraffic-common/stack/subscription";
import {defaultLambdaConfiguration} from 'digitraffic-common/stack/lambda-configs';
import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {VoyagePlanEnvKeys} from "./keys";
import {VoyagePlanGatewayProps} from "./app-props";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {createRestApi,} from "digitraffic-common/api/rest_apis";
import {Topic} from "@aws-cdk/aws-sns";

export function create(
    secret: ISecret,
    notifyTopic: Topic,
    props: VoyagePlanGatewayProps,
    stack: Construct) {

    const integrationApi = createRestApi(
        stack,
        'VPGW-Integration',
        'VPGW integration API');
    // set response for missing auth token to 501 as desired by API registrar
    new GatewayResponse(stack, 'MissingAuthenticationTokenResponse', {
        restApi: integrationApi,
        type: ResponseType.MISSING_AUTHENTICATION_TOKEN,
        statusCode: '501',
        templates: {
            'application/json': 'Not implemented'
        }
    });
    createUsagePlan(integrationApi, 'VPGW CloudFront API Key', 'VPGW Faults CloudFront Usage Plan');
    const resource = integrationApi.root.addResource("vpgw")
    createNotifyHandler(secret, stack, notifyTopic, resource, props);
}

function createNotifyHandler(
    secret: ISecret,
    stack: Construct,
    notifyTopic: Topic,
    api: Resource,
    props: VoyagePlanGatewayProps) {

    const handler = createHandler(stack, notifyTopic, props);
    secret.grantRead(handler);
    const resource = api.addResource("notify")
    createIntegrationResource(stack, secret, props, resource, handler);
}

function createIntegrationResource(
    stack: Construct,
    secret: ISecret,
    props: VoyagePlanGatewayProps,
    resource: Resource,
    handler: Function) {

    const integration = new LambdaIntegration(handler, {
        proxy: true,
        integrationResponses: [
            { statusCode: '204' }
        ],
        passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH // because of proxy type integration
    });

    resource.addMethod("POST", integration, {
        apiKeyRequired: true,
        methodResponses: [
            { statusCode: '204' }
        ]
    });
}

function createHandler(
    stack: Construct,
    notifyTopic: Topic,
    props: VoyagePlanGatewayProps,
): Function {
    const functionName = 'VPGW-Notify';
    const environment: any = {};
    environment[VoyagePlanEnvKeys.TOPIC_ARN] = notifyTopic.topicArn;
    const handler = new Function(stack, functionName, defaultLambdaConfiguration({
        functionName,
        code: new AssetCode('dist/lambda/notify'),
        handler: 'lambda-notify.handler',
        environment
    }));
    notifyTopic.grantPublish(handler);
    createSubscription(handler, functionName, props.logsDestinationArn, stack);
    return handler;
}
