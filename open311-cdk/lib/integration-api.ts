import apigateway = require('@aws-cdk/aws-apigateway');
import iam = require('@aws-cdk/aws-iam');
import * as lambda from '@aws-cdk/aws-lambda';
import {EndpointType, LambdaIntegration} from "@aws-cdk/aws-apigateway";
import {Construct} from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import {dbLambdaConfiguration} from "./cdk-util";
import {createSubscription} from "../../common/stack/subscription";

// returns lambda names for log group subscriptions
export function create(vpc: ec2.IVpc, lambdaDbSg: ec2.ISecurityGroup, stack: Construct, props: Props): string[] {
    const integrationApi = createApi(stack, props.vpcId);
    const lambdaName = createRequestsResource(stack, integrationApi, vpc, lambdaDbSg, props);
    createUsagePlan(integrationApi);
    return [lambdaName];
}

function createApi(stack: Construct, vpcId: string) {
    return new apigateway.RestApi(stack, 'Open311-integration', {
        deployOptions: {
            loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        },
        restApiName: 'Open311 integration API',
        endpointTypes: [EndpointType.PRIVATE],
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
                    conditions: {
                        "StringEquals": {
                            "aws:sourceVpc": vpcId
                        }
                    },
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
    props: Props): string {
    const requests = integrationApi.root.addResource("requests");

    const updateRequestsId = 'UpdateRequests';
    const updateRequestsHandler = new lambda.Function(stack, updateRequestsId, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: updateRequestsId,
        code: new lambda.AssetCode('dist/lambda/update-requests'),
        handler: 'lambda-update-requests.handler'
    }));
    createSubscription(updateRequestsHandler, updateRequestsId, props.logsDestinationArn, stack);
    const updateRequestsIntegration = new LambdaIntegration(updateRequestsHandler);
    requests.addMethod("POST", updateRequestsIntegration, {
        apiKeyRequired: true
    });

    return updateRequestsId;
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
