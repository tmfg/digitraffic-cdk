import apigateway = require('@aws-cdk/aws-apigateway');
import iam = require('@aws-cdk/aws-iam');
import * as lambda from '@aws-cdk/aws-lambda';
import * as ec2 from '@aws-cdk/aws-ec2';
import {EndpointType, LambdaIntegration} from "@aws-cdk/aws-apigateway";
import {Stack} from "@aws-cdk/core";
import {dbLambdaConfiguration} from "./cdk-util";
import {createSubscription} from '../../common/stack/subscription';

export function create(
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: Props,
    stack: Stack): lambda.Function {
    const publicApi = createApi(stack, props);

    return createAnnotationsResource(publicApi, vpc, props, lambdaDbSg, stack)
}

function createAnnotationsResource(
    publicApi: apigateway.RestApi,
    vpc: ec2.IVpc,
    props: Props,
    lambdaDbSg: ec2.ISecurityGroup,
    stack: Stack): lambda.Function {

    const functionName = 'NW2-GetAnnotations';
    const getAnnotationsLambda = new lambda.Function(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: new lambda.AssetCode('dist/lambda/get-annotations'),
        handler: 'lambda-get-annotations.handler',
    }));
    const getAnnotationsIntegration = new LambdaIntegration(getAnnotationsLambda);
    const requests = publicApi.root.addResource("annotations");
    requests.addMethod("GET", getAnnotationsIntegration);

    createSubscription(getAnnotationsLambda, functionName, props.logsDestinationArn, stack);

    return getAnnotationsLambda;
}

function createApi(stack: Stack, props: Props) {
    return new apigateway.RestApi(stack, 'Nordicway2-public', {
        deployOptions: {
            loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        },
        restApiName: 'Nordicway2 public API',
        endpointTypes: [EndpointType.REGIONAL],
        minimumCompressionSize: 1000,
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
                        "IpAddress": {
                            "aws:SourceIp" : [
                                "185.18.77.12/32",
                                "109.204.231.81/32",
                                "46.30.132.132/32"
                            ]
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