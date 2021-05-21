import {
    EndpointType,
    GatewayResponse,
    LambdaIntegration,
    MethodLoggingLevel,
    PassthroughBehavior,
    Resource,
    ResponseType,
    RestApi
} from '@aws-cdk/aws-apigateway';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {Construct} from "@aws-cdk/core";
import {createSubscription} from "../../../common/stack/subscription";
import {defaultLambdaConfiguration} from '../../../common/stack/lambda-configs';
import {createUsagePlan} from "../../../common/stack/usage-plans";
import {VoyagePlanEnvKeys} from "./keys";
import {VoyagePlanGatewayProps} from "./app-props";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {IVpc} from "@aws-cdk/aws-ec2";
import {add404Support, createDefaultPolicyDocument, createRestApi,} from "digitraffic-common/api/rest_apis";

export function create(
    secret: ISecret,
    vpc: IVpc,
    props: VoyagePlanGatewayProps,
    stack: Construct) {

    const integrationApi = createRestApi(
        stack,
        'VPGW-Integration',
        'VPGW integration API',
        props.allowFromIpAddresses);
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
    createNotifyHandler(secret, stack, resource, props);
}

function createNotifyHandler(
    secret: ISecret,
    stack: Construct,
    api: Resource,
    props: VoyagePlanGatewayProps) {

    const handler = createHandler(stack, props);
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
        passthroughBehavior: PassthroughBehavior.NEVER
    });

    resource.addMethod("POST", integration, {
        apiKeyRequired: true,
        methodResponses: [
            { statusCode: '200' }
        ]
    });
}

function createHandler(
    stack: Construct,
    props: VoyagePlanGatewayProps,
): Function {
    const functionName = 'VPGW-Notify';
    const environment: any = {};
    environment[VoyagePlanEnvKeys.SECRET_ID] = props.secretId;
    const handler = new Function(stack, functionName, defaultLambdaConfiguration({
        functionName,
        code: new AssetCode('dist/lambda/notify'),
        handler: 'lambda-notify.handler',
        environment
    }));
    createSubscription(handler, functionName, props.logsDestinationArn, stack);
    return handler;
}
