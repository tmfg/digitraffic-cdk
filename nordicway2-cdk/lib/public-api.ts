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
    const annotationLambdaNames = createAnnotationsResource(publicApi, vpc, props, lambdaDbSg, stack)

    return annotationLambdaNames;
}

function createAnnotationsResource(
    publicApi: apigateway.RestApi,
    vpc: ec2.IVpc,
    props: Props,
    lambdaDbSg: ec2.ISecurityGroup,
    stack: Construct): string[] {

    const getAnnotations = 'GetAnnotations';
    const getAnnotationsHandler = new lambda.Function(stack, getAnnotations, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: getAnnotations,
        code: new lambda.AssetCode('dist/lambda/get-annotations'),
        handler: 'lambda-get-annotations.handler'
    }));
    const getAnnotationsIntegration = new LambdaIntegration(getAnnotationsHandler);
    const requests = publicApi.root.addResource("annotations");
    requests.addMethod("GET", getAnnotationsIntegration);

    return [getAnnotations];
}

function createApi(stack: Construct, props: Props) {
    return new apigateway.RestApi(stack, 'Nordicway2-public', {
        deployOptions: {
            loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        },
        restApiName: 'Nordicway2 public API',
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