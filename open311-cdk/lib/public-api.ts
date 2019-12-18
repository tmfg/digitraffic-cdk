import apigateway = require('@aws-cdk/aws-apigateway');
import iam = require('@aws-cdk/aws-iam');
import * as lambda from '@aws-cdk/aws-lambda';
import * as ec2 from '@aws-cdk/aws-ec2';
import {EndpointType, LambdaIntegration} from "@aws-cdk/aws-apigateway";
import {Construct} from "@aws-cdk/core";
import {dbLambdaConfiguration} from "./cdk-util";

export function create(
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    stack: Construct,
    props: Props): string[] {
    const publicApi = createApi(stack, props);
    const requestLambdaNames = createRequestsResource(publicApi, vpc, props, lambdaDbSg, stack)
    const serviceLambdaNames = createServicesResource(publicApi, vpc, props, lambdaDbSg, stack)
    return requestLambdaNames.concat(serviceLambdaNames);
}

function createRequestsResource(
    publicApi: apigateway.RestApi,
    vpc: ec2.IVpc,
    props: Props,
    lambdaDbSg: ec2.ISecurityGroup,
    stack: Construct): string[] {

    const getRequestsId = 'GetRequests';
    const getRequestsHandler = new lambda.Function(stack, getRequestsId, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: getRequestsId,
        code: new lambda.AssetCode('dist/lambda/get-requests'),
        handler: 'lambda-get-requests.handler'
    }));
    const getRequestsIntegration = new LambdaIntegration(getRequestsHandler);
    const requests = publicApi.root.addResource("requests");
    requests.addMethod("GET", getRequestsIntegration);

    const getRequestId = 'GetRequest';
    const getRequestHandler = new lambda.Function(stack, getRequestId, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: getRequestId,
        code: new lambda.AssetCode('dist/lambda/get-request'),
        handler: 'lambda-get-request.handler'
    }));
    const getRequestIntegration = new LambdaIntegration(getRequestHandler);
    const request = requests.addResource("{request_id}");
    request.addMethod("GET", getRequestIntegration);

    return [getRequestsId, getRequestId];
}

function createServicesResource(
    publicApi: apigateway.RestApi,
    vpc: ec2.IVpc,
    props: Props,
    lambdaDbSg: ec2.ISecurityGroup,
    stack: Construct): string[] {

    const getServicesId = 'GetServices';
    const getServicesHandler = new lambda.Function(stack, getServicesId, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: getServicesId,
        code: new lambda.AssetCode('dist/lambda/get-services'),
        handler: 'lambda-get-services.handler'
    }));
    const getServicesIntegration = new LambdaIntegration(getServicesHandler);

    const services = publicApi.root.addResource("services");
    services.addMethod("GET", getServicesIntegration);

    const getServiceId = 'GetService';
    const getServiceHandler = new lambda.Function(stack, getServiceId, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: getServiceId,
        code: new lambda.AssetCode('dist/lambda/get-service'),
        handler: 'lambda-get-service.handler'
    }));

    const getServiceIntegration = new LambdaIntegration(getServiceHandler);
    const service = services.addResource("{service_id}");
    service.addMethod("GET", getServiceIntegration);

    return [getServicesId, getServiceId];
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