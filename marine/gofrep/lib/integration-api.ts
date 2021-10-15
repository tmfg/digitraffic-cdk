import {
    EndpointType,
    IModel,
    MethodLoggingLevel,
    MockIntegration,
    PassthroughBehavior,
    Resource,
    RestApi
} from '@aws-cdk/aws-apigateway';
import {Construct} from "@aws-cdk/core";
import {add404Support, createDefaultPolicyDocument,} from "digitraffic-common/api/rest_apis";
import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {FormalityResponse} from "./model/formality";
import {dbFunctionProps} from "digitraffic-common/stack/lambda-configs";
import {createSubscription} from "digitraffic-common/stack/subscription";
import {AssetCode} from '@aws-cdk/aws-lambda';
import {
    defaultIntegration,
    getResponse,
    methodResponse,
    RESPONSE_400_BAD_REQUEST,
    RESPONSE_500_SERVER_ERROR,
} from "digitraffic-common/api/responses";
import {addSimpleServiceModel} from "digitraffic-common/api/utils";
import {MediaType} from "digitraffic-common/api/mediatypes";
import {createResponses, INPUT_RAW, MessageModel} from "digitraffic-common/api/response";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {TrafficType} from "digitraffic-common/model/traffictype";

export function create(stack: DigitrafficStack) {

    const api = createRestApi(
        stack,
        'GOFREP-Public',
        'GOFREP public API');
    const xmlModel = addSimpleServiceModel('XmlModel', api);
    const messageModel = api.addModel('MessageResponseModel', MessageModel);
    const resource = api.root.addResource('mrs');
    createUsagePlan(api, 'GOFREP integration API Key', 'GOFREP integration Usage Plan');
    createMrsReportingFormalityResource(resource);
    createReceiveMrsReportResource(stack, resource, xmlModel, messageModel);
}

function createRestApi(stack: Construct, apiId: string, apiName: string): RestApi {
    const restApi = new RestApi(stack, apiId, {
        deployOptions: {
            loggingLevel: MethodLoggingLevel.ERROR,
        },
        restApiName: apiName,
        endpointTypes: [EndpointType.REGIONAL],
        policy: createDefaultPolicyDocument()
    });
    add404Support(restApi, stack);
    return restApi;
}

function createMrsReportingFormalityResource(resource: Resource) {
    const integration = new MockIntegration({
        passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
        requestTemplates: {
            'application/json': `{
                "statusCode": 200
            }`
        },
        integrationResponses: [{
            statusCode: '200',
            responseTemplates: {
                // application/json is the default mapping if no content-type is passed in the request
                // override the response content-type to application/xml in the response
                'application/json': `
                    #set($context.responseOverride.header.Content-Type = "application/xml")
                    ${FormalityResponse}
                `.trim()
            }
        }]
    });

    const metadataResource = resource.addResource('formality');

    metadataResource.addMethod("GET", integration, {
        apiKeyRequired: true,
        methodResponses: [{
            statusCode: '200'
        }]
    });
}

function createReceiveMrsReportResource(
    stack: DigitrafficStack,
    resource: Resource,
    xmlModel: IModel,
    messageModel: IModel) {

    const metadataResource = resource.addResource('report');
    const functionName = 'GOFREP-ReceiveMRSReport';
    // ATTENTION!
    // This lambda needs to run in a VPC so that the outbound IP address is always the same (NAT Gateway).
    // The reason for this is IP based restriction in another system's firewall.
    const handler = MonitoredFunction.create(stack, functionName, dbFunctionProps(stack,{
        functionName,
        code: new AssetCode('dist/lambda'),
        handler: 'lambda-receive-epcmessage.handler',
        timeout: 10,
        memorySize: 128,
    }));
    createSubscription(handler, functionName, stack.configuration.logsDestinationArn, stack);

    const integration = defaultIntegration(handler, {
        passthroughBehavior: PassthroughBehavior.NEVER,
        disableCors: true,
        requestTemplates: {
            // transformation from XML to JSON in API Gateway
            // some stuff needs to be quotes, other stuff does not, it's magic
            'application/xml': `{
                "body": $input.json('$')
            }`
        },
        responses: [
            {statusCode: '200', responseTemplates: createResponses(MediaType.APPLICATION_XML, INPUT_RAW)},
            getResponse(RESPONSE_400_BAD_REQUEST, {disableCors: true}),
            getResponse(RESPONSE_500_SERVER_ERROR, {disableCors: true})
        ]
    });
    metadataResource.addMethod('POST', integration, {
        apiKeyRequired: true,
        methodResponses: [
            methodResponse("200", MediaType.APPLICATION_XML, xmlModel),
            methodResponse("400", MediaType.APPLICATION_JSON, messageModel),
            methodResponse("500", MediaType.APPLICATION_JSON, messageModel)
        ]
    });
}
