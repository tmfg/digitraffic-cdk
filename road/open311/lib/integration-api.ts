import apigateway = require('aws-cdk-lib/aws-apigateway');
import iam = require('aws-cdk-lib/aws-iam');
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {EndpointType, LambdaIntegration} from "aws-cdk-lib/aws-apigateway";
import {Construct} from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import {dbLambdaConfiguration} from 'digitraffic-common/stack/lambda-configs';
import {createSubscription} from "digitraffic-common/stack/subscription";
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/api/responses";
import {addDefaultValidator} from "digitraffic-common/api/utils";
import {MessageModel} from "digitraffic-common/api/response";
import {MediaType} from "digitraffic-common/api/mediatypes";

export function create(vpc: ec2.IVpc, lambdaDbSg: ec2.ISecurityGroup, stack: Construct, props: Props) {
    const integrationApi = createApi(stack, props.vpcId);
    createRequestsResource(
        stack, integrationApi, vpc, lambdaDbSg, props,
    );
    createUsagePlan(integrationApi);
}

function createApi(stack: Construct, vpcId: string) {
    return new apigateway.RestApi(stack, 'Open311-integration', {
        deployOptions: {
            loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        },
        restApiName: 'Open311 integration API',
        endpointTypes: [EndpointType.REGIONAL],
        policy: new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        "execute-api:Invoke",
                    ],
                    resources: [
                        "*",
                    ],
                    principals: [
                        new iam.AnyPrincipal(),
                    ],
                }),
            ],
        }),
    });
}

function createRequestsResource(
    stack: Construct,
    integrationApi: apigateway.RestApi,
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props,
) {
    const validator = addDefaultValidator(integrationApi);
    const apiResource = integrationApi.root.addResource("api");
    const v1Resource = apiResource.addResource("v1");
    const open311Resource = v1Resource.addResource("open311");
    const requests = open311Resource.addResource("requests");
    const messageResponseModel = integrationApi.addModel('MessageResponseModel', MessageModel);

    createUpdateRequestHandler(
        requests, stack, vpc, lambdaDbSg, props,
    );
    createDeleteRequestHandler(
        requests, messageResponseModel, validator, stack, vpc, lambdaDbSg, props,
    );
}

function createUpdateRequestHandler(
    requests: apigateway.Resource,
    stack: Construct,
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props,
) {
    const updateRequestsId = 'UpdateRequests';
    const updateRequestsHandler = new lambda.Function(stack, updateRequestsId, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: updateRequestsId,
        code: new lambda.AssetCode('dist/lambda/update-requests'),
        handler: 'lambda-update-requests.handler',
    }));
    requests.addMethod("POST", new LambdaIntegration(updateRequestsHandler), {
        apiKeyRequired: true,
    });
    createSubscription(updateRequestsHandler, updateRequestsId, props.logsDestinationArn, stack);
}

function createDeleteRequestHandler(
    requests: apigateway.Resource,
    messageResponseModel: apigateway.Model,
    validator: apigateway.RequestValidator,
    stack: Construct,
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props,
) {
    const deleteRequestId = 'DeleteRequest';
    const deleteRequestHandler = new lambda.Function(stack, deleteRequestId, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: deleteRequestId,
        code: new lambda.AssetCode('dist/lambda/delete-request'),
        handler: 'lambda-delete-request.handler',
    }));
    const deleteRequestIntegration = defaultIntegration(deleteRequestHandler, {
        requestParameters: {
            'integration.request.path.request_id': 'method.request.path.request_id',
            'integration.request.querystring.extensions': 'method.request.querystring.extensions',
        },
        requestTemplates: {
            'application/json': JSON.stringify({
                request_id: "$util.escapeJavaScript($input.params('request_id'))",
                extensions: "$util.escapeJavaScript($input.params('extensions'))",
            }),
        },
    });
    const request = requests.addResource("{request_id}");
    request.addMethod("DELETE", deleteRequestIntegration, {
        apiKeyRequired: true,
        requestValidator: validator,
        requestParameters: {
            'method.request.path.request_id': true,
            'method.request.querystring.extensions': false,
        },
        methodResponses: [
            corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, messageResponseModel)),
            corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, messageResponseModel)),
        ],
    });
    createSubscription(deleteRequestHandler, deleteRequestId, props.logsDestinationArn, stack);
}

function createUsagePlan(integrationApi: apigateway.RestApi) {
    const apiKey = integrationApi.addApiKey('Integration API key');
    const plan = integrationApi.addUsagePlan('Integration Usage Plan', {
        name: 'Integration Usage Plan',
    });
    plan.addApiStage({
        stage: integrationApi.deploymentStage,
    });
    plan.addApiKey(apiKey);
}
