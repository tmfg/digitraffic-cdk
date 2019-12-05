import apigateway = require('@aws-cdk/aws-apigateway');
import iam = require('@aws-cdk/aws-iam');
const lambda = require('@aws-cdk/aws-lambda');
import * as ec2 from '@aws-cdk/aws-ec2';
import {EndpointType, LambdaIntegration} from "@aws-cdk/aws-apigateway";
import {Construct} from "@aws-cdk/core";
import {dbLambdaConfiguration} from "./cdk-util";

export function create(
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    stack: Construct,
    props: Props) {
    const publicApi = createApi(stack, props);
    createRequestsResource(publicApi, vpc, props, lambdaDbSg, stack)
    createServicesResource(publicApi, vpc, props, lambdaDbSg, stack)
}

function createRequestsResource(
    publicApi: apigateway.RestApi,
    vpc: ec2.IVpc,
    props: Props,
    lambdaDbSg: ec2.ISecurityGroup,
    stack: Construct) {
    const getRequestsHandler = new lambda.Function(stack, 'GetRequestsLambda', dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        code: new lambda.AssetCode('lib/lambda/get-requests'),
        handler: 'lambda-get-requests.handler'
    }));
    const getRequestsIntegration = new LambdaIntegration(getRequestsHandler);
    const requests = publicApi.root.addResource("requests");
    requests.addMethod("GET", getRequestsIntegration);

    const getRequestHandler = new lambda.Function(stack, 'GetRequestLambda', dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        code: new lambda.AssetCode('lib/lambda/get-request'),
        handler: 'lambda-get-request.handler'
    }));
    const getRequestIntegration = new LambdaIntegration(getRequestHandler);
    const request = requests.addResource("{request_id}");
    request.addMethod("GET", getRequestIntegration);
}

function createServicesResource(
    publicApi: apigateway.RestApi,
    vpc: ec2.IVpc,
    props: Props,
    lambdaDbSg: ec2.ISecurityGroup,
    stack: Construct) {
    const getServicesHandler = new lambda.Function(stack, 'GetServicesLambda', dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        code: new lambda.AssetCode('lib/lambda/get-services'),
        handler: 'lambda-get-services.handler'
    }));
    const getServicesIntegration = new LambdaIntegration(getServicesHandler);
    const services = publicApi.root.addResource("services");
    services.addMethod("GET", getServicesIntegration);

    const getServiceHandler = new lambda.Function(stack, 'GetServiceLambda', dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        code: new lambda.AssetCode('lib/lambda/get-service'),
        handler: 'lambda-get-service.handler'
    }));
    const getServiceIntegration = new LambdaIntegration(getServiceHandler);
    const service = services.addResource("{service_id}");
    service.addMethod("GET", getServiceIntegration);
}

function createApi(stack: Construct, props: Props) {
    return new apigateway.RestApi(stack, 'Open311-public', {
        deployOptions: {
            loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        },
        restApiName: 'Open311 public API',
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
                            "aws:sourceVpc": props.vpcId
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