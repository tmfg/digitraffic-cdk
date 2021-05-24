import {
    EndpointType,
    MethodLoggingLevel,
    MockIntegration,
    PassthroughBehavior,
    Resource,
    RestApi
} from '@aws-cdk/aws-apigateway';
import {Construct} from "@aws-cdk/core";
import {add404Support, createDefaultPolicyDocument,} from "../../../common/api/rest_apis";
import {createUsagePlan} from "../../../common/stack/usage-plans";
import {FormalityResponse} from "./model/formality";

export function create(stack: Construct) {
    const api = createRestApi(
        stack,
        'GOFREP-Public',
        'GOFREP public API');

    const resource = api.root.addResource('gofrep');
    createUsagePlan(api, 'GOFREP Public CloudFront API Key', 'GOFREP Public CloudFront Usage Plan');
    createMrsReportingFormalityResource(resource);
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
            'application/xml': `{
                "statusCode": 200
            }`
        },
        integrationResponses: [{
            statusCode: '200',
            responseTemplates: {
                'application/xml': FormalityResponse
            }
        }]
    });

    const metadataResource = resource.addResource('formality');

    metadataResource.addMethod("GET", integration, {
        apiKeyRequired: false,
        methodResponses: [{
            statusCode: '200'
        }]
    });
}
