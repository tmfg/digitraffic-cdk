import {GatewayResponse, Model, PassthroughBehavior, Resource, ResponseType, RestApi} from '@aws-cdk/aws-apigateway';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {Construct} from "@aws-cdk/core";
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {createSubscription} from "digitraffic-common/stack/subscription";
import {dbLambdaConfiguration} from 'digitraffic-common/stack/lambda-configs';
import {createRestApi, setReturnCodeForMissingAuthenticationToken} from "digitraffic-common/api/rest_apis";
import {Topic} from "@aws-cdk/aws-sns";
import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {KEY_SECRET_ID, KEY_SEND_FAULT_SNS_TOPIC_ARN} from "./lambda/upload-voyage-plan/lambda-upload-voyage-plan";
import {AtonProps} from "./app-props";
import {defaultIntegration, methodResponse} from "digitraffic-common/api/responses";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {MediaType} from "digitraffic-common/api/mediatypes";
import {MessageModel} from "digitraffic-common/api/response";
import {addQueryParameterDescription, addTagsAndSummary} from "digitraffic-common/api/documentation";

export function create(
    secret: ISecret,
    sendFaultTopic: Topic,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonProps,
    stack: Construct) {

    const integrationApi = createRestApi(
        stack,
        'ATON-Integration',
        'ATON Faults integration API');

    // set response for missing auth token to 501 as desired by API registrar
    setReturnCodeForMissingAuthenticationToken(501, 'Not implemented', integrationApi, stack);

    createUsagePlan(integrationApi, 'ATON Faults CloudFront API Key', 'ATON Faults CloudFront Usage Plan');
    const messageResponseModel = integrationApi.addModel('MessageResponseModel', MessageModel);
    createUploadVoyagePlanHandler(messageResponseModel, secret, sendFaultTopic, stack, integrationApi, vpc, lambdaDbSg, props);
}

function createUploadVoyagePlanHandler(
    messageResponseModel: Model,
    secret: ISecret,
    sendFaultTopic: Topic,
    stack: Construct,
    integrationApi: RestApi,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonProps) {

    const handler = createHandler(sendFaultTopic, stack, vpc, lambdaDbSg, props);
    secret.grantRead(handler);
    const resource = integrationApi.root.addResource("s124").addResource("voyagePlans")
    createIntegrationResource(stack, messageResponseModel, resource, handler);
    sendFaultTopic.grantPublish(handler);
}

function createIntegrationResource(
    stack: Construct,
    messageResponseModel: Model,
    resource: Resource,
    handler: Function) {

    const integration = defaultIntegration(handler, {
        passthroughBehavior: PassthroughBehavior.NEVER,
        disableCors: true,
        requestParameters: {
            'integration.request.querystring.callbackEndpoint': 'method.request.querystring.callbackEndpoint'
        },
        requestTemplates: {
            // transformation from XML to JSON in API Gateway
            // some stuff needs to be quotes, other stuff does not, it's magic
            'text/xml': `{
                "callbackEndpoint": "$util.escapeJavaScript($input.params('callbackEndpoint'))",
                "voyagePlan": $input.json('$')
            }`
        }
    });
    resource.addMethod("POST", integration, {
        apiKeyRequired: true,
        requestParameters: {
            'method.request.querystring.callbackEndpoint': false
        },
        methodResponses: [
            methodResponse("200", MediaType.APPLICATION_JSON, messageResponseModel),
            methodResponse("400", MediaType.APPLICATION_JSON, messageResponseModel),
            methodResponse("500", MediaType.APPLICATION_JSON, messageResponseModel)
        ]
    });
    addQueryParameterDescription(
        'callbackEndpoint',
        'URL endpoint where S-124 ATON faults are sent',
        resource,
        stack);
    addTagsAndSummary(
        'ATON Faults',
        ['API'],
        'Upload voyage plan in RTZ format in HTTP POST body. Active ATON faults relevant to the voyage plan are sent back in S-124 format if the query parameter callbackEndpoint is supplied.',
        resource,
        stack);
}

function createHandler(
    sendFaultTopic: Topic,
    stack: Construct,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonProps,
): Function {
    const functionName = 'ATON-UploadVoyagePlan';
    const environment: any = {};
    environment[KEY_SECRET_ID] = props.secretId;
    environment[KEY_SEND_FAULT_SNS_TOPIC_ARN] = sendFaultTopic.topicArn;
    const handler = new Function(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName,
        code: new AssetCode('dist/lambda/upload-voyage-plan'),
        handler: 'lambda-upload-voyage-plan.handler',
        environment
    }));
    createSubscription(handler, functionName, props.logsDestinationArn, stack);
    return handler;
}
