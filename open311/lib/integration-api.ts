import apigateway = require('@aws-cdk/aws-apigateway');
import iam = require('@aws-cdk/aws-iam');
import * as lambda from '@aws-cdk/aws-lambda';
import {EndpointType, LambdaIntegration} from "@aws-cdk/aws-apigateway";
import {Construct} from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import {dbLambdaConfiguration} from "./cdk-util";
import {createSubscription} from "../../common/stack/subscription";

// returns lambda names for log group subscriptions
export function create(vpc: ec2.IVpc, lambdaDbSg: ec2.ISecurityGroup, stack: Construct, props: Props) {
    const integrationApi = createApi(stack, props.vpcId);
    createRequestsResource(stack, integrationApi, vpc, lambdaDbSg, props);
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
                        "execute-api:Invoke"
                    ],
                    resources: [
                        "*"
                    ],
                    principals: [
                        new iam.AnyPrincipal()
                    ]
                })
            ]
        })
    });
}

function createRequestsResource(
    stack: Construct,
    integrationApi: apigateway.RestApi,
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props) {
    const apiResource = integrationApi.root.addResource("api");
    const v1Resource = apiResource.addResource("v1");
    const open311Resource = v1Resource.addResource("open311");
    const requests = open311Resource.addResource("requests");

    const updateRequestsId = 'UpdateRequests';
    const updateRequestsHandler = new lambda.Function(stack, updateRequestsId, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: updateRequestsId,
        code: new lambda.AssetCode('dist/lambda/update-requests'),
        handler: 'lambda-update-requests.handler'
    }));
    requests.addMethod("POST", new LambdaIntegration(updateRequestsHandler), {
        apiKeyRequired: true
    });
    createSubscription(updateRequestsHandler, updateRequestsId, props.logsDestinationArn, stack);

    const deleteRequestId = 'DeleteRequest';
    const deleteRequestHandler = new lambda.Function(stack, deleteRequestId, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: deleteRequestId,
        code: new lambda.AssetCode('dist/lambda/delete-request'),
        handler: 'lambda-delete-request.handler'
    }));
    requests.addMethod("DELETE", new LambdaIntegration(deleteRequestHandler), {
        apiKeyRequired: true
    });
    createSubscription(deleteRequestHandler, deleteRequestId, props.logsDestinationArn, stack);
}

function createUsagePlan(integrationApi: apigateway.RestApi) {
    const apiKey = integrationApi.addApiKey('Integration API key');
    const plan = integrationApi.addUsagePlan('Integration Usage Plan', {
        name: 'Integration Usage Plan',
        apiKey
    });
    plan.addApiStage({
        stage: integrationApi.deploymentStage
    });
}
