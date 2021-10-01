import {Model, PassthroughBehavior, Resource, RestApi} from '@aws-cdk/aws-apigateway';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {Construct} from "@aws-cdk/core";
import {createSubscription} from "digitraffic-common/stack/subscription";
import {dbFunctionProps} from 'digitraffic-common/stack/lambda-configs';
import {DigitrafficRestApi} from "digitraffic-common/api/rest_apis";
import {Topic} from "@aws-cdk/aws-sns";
import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {defaultIntegration, methodResponse} from "digitraffic-common/api/responses";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {MediaType} from "digitraffic-common/api/mediatypes";
import {MessageModel} from "digitraffic-common/api/response";
import {addQueryParameterDescription, addTagsAndSummary} from "digitraffic-common/api/documentation";
import {AtonEnvKeys} from "./keys";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {TrafficType} from "digitraffic-common/model/traffictype";

export function create(stack: DigitrafficStack, secret: ISecret, sendFaultTopic: Topic) {
    const integrationApi = new DigitrafficRestApi(stack,
        'ATON-Integration',
        'ATON Faults integration API');

    // set response for missing auth token to 501 as desired by API registrar
    //setReturnCodeForMissingAuthenticationToken(501, 'Not implemented', integrationApi, stack);

    createUsagePlan(integrationApi, 'ATON Faults CloudFront API Key', 'ATON Faults CloudFront Usage Plan');
    const messageResponseModel = integrationApi.addModel('MessageResponseModel', MessageModel);
    createUploadVoyagePlanHandler(stack, messageResponseModel, secret, sendFaultTopic, integrationApi);
}

function createUploadVoyagePlanHandler(
    stack: DigitrafficStack,
    messageResponseModel: Model,
    secret: ISecret,
    sendFaultTopic: Topic,
    integrationApi: RestApi) {

    const handler = createHandler(stack, sendFaultTopic);
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

function createHandler(stack: DigitrafficStack, sendFaultTopic: Topic): Function {
    const functionName = 'ATON-UploadVoyagePlan';
    const environment = stack.createDefaultLambdaEnvironment('ATON');
    environment[AtonEnvKeys.SEND_FAULT_SNS_TOPIC_ARN] = sendFaultTopic.topicArn;

    const handler = MonitoredFunction.create(stack, functionName, dbFunctionProps(stack, {
        memorySize: 512,
        functionName,
        code: new AssetCode('dist/lambda/upload-voyage-plan'),
        handler: 'lambda-upload-voyage-plan.handler',
        environment
    }), TrafficType.MARINE);
    createSubscription(handler, functionName, stack.configuration.logsDestinationArn, stack);
    return handler;
}
