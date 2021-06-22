import {
    EndpointType,
    LambdaIntegration,
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
import {defaultLambdaConfiguration} from "digitraffic-common/stack/lambda-configs";
import {createSubscription} from "digitraffic-common/stack/subscription";
import {IVpc} from "@aws-cdk/aws-ec2";
import {GofrepProps} from "./app-props";
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {defaultIntegration} from "digitraffic-common/api/responses";

export function create(
    stack: Construct,
    vpc: IVpc,
    props: GofrepProps) {

    const api = createRestApi(
        stack,
        'GOFREP-Public',
        'GOFREP public API');

    const resource = api.root.addResource('gofrep');
    createUsagePlan(api, 'GOFREP Public CloudFront API Key', 'GOFREP Public CloudFront Usage Plan');
    createMrsReportingFormalityResource(resource);
    createReceiveMrsReportResource(stack, resource, vpc, props);
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
        apiKeyRequired: true,
        methodResponses: [{
            statusCode: '200'
        }]
    });
}

function createReceiveMrsReportResource(
    stack: Construct,
    resource: Resource,
    vpc: IVpc,
    props: GofrepProps) {

    const metadataResource = resource.addResource('report');
    const functionName = 'GOFREP-ReceiveMRSReport';
    // ATTENTION!
    // This lambda needs to run in a VPC so that the outbound IP address is always the same (NAT Gateway).
    // The reason for this is IP based restriction in another system's firewall.
    const handler = new Function(stack, functionName, defaultLambdaConfiguration({
        functionName,
        code: new AssetCode('dist/lambda'),
        handler: 'lambda-receive-epcmessage.handler',
        vpc: vpc
    }));
    const integration = defaultIntegration(handler, {
        xml: true
    });
    metadataResource.addMethod('GET', integration, {
        apiKeyRequired: true
    });
    createSubscription(handler, functionName, props.logsDestinationArn, stack);
}
