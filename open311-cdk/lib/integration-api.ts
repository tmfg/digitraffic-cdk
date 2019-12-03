import apigateway = require('@aws-cdk/aws-apigateway');
import iam = require('@aws-cdk/aws-iam');
const lambda = require('@aws-cdk/aws-lambda');
import {EndpointType, LambdaIntegration} from "@aws-cdk/aws-apigateway";
import {Construct, Duration} from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import {defaultLambdaConfiguration} from "./cdk-util";

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
    props: Props) {
    const requests = integrationApi.root.addResource("requests");

    const newRequestHandler = new lambda.Function(stack, 'NewRequestLambda', defaultLambdaConfiguration(vpc, lambdaDbSg, props, {
        code: new lambda.AssetCode('lib/lambda/new-request'),
        handler: 'lambda-new-request.handler'
    }));
    const newRequestIntegration = new LambdaIntegration(newRequestHandler);
    requests.addMethod("POST", newRequestIntegration, {
        apiKeyRequired: true
    });

    const editRequestsHandler = new lambda.Function(stack, 'EditRequestsLambda', defaultLambdaConfiguration(vpc, lambdaDbSg, props, {
        code: new lambda.AssetCode('lib/lambda/edit-requests'),
        handler: 'lambda-edit-requests.handler'
    }));
    const editRequestsIntegration = new LambdaIntegration(editRequestsHandler);
    requests.addMethod("PUT", editRequestsIntegration, {
        apiKeyRequired: true
    });

    const editRequestHandler = new lambda.Function(stack, 'EditRequestLambda', defaultLambdaConfiguration(vpc, lambdaDbSg, props, {
        code: new lambda.AssetCode('lib/lambda/edit-request'),
        handler: 'lambda-edit-request.handler'
    }));
    const editRequestIntegration = new LambdaIntegration(editRequestHandler);
    const request = requests.addResource("{request_id}");
    request.addMethod("PUT", editRequestIntegration, {
        apiKeyRequired: true
    });
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
