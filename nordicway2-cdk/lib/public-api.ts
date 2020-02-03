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
    props: NW2Props,
    stack: Stack): lambda.Function {
    const publicApi = createApi(stack, props);

    return createAnnotationsResource(publicApi, vpc, props, lambdaDbSg, stack)
}

function createAnnotationsResource(
    publicApi: apigateway.RestApi,
    vpc: ec2.IVpc,
    props: NW2Props,
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

function getCondition(nw2Props: NW2Props):any {
    return nw2Props.private ? {
        "StringEquals": {
            "aws:sourceVpc": nw2Props.vpcId
        }
    } : {
        "StringEquals": {
            "aws:RequestTag/CloudFront": "Value"
        }
    };
}

function createApi(stack: Stack, nw2Props: NW2Props) {
    return new apigateway.RestApi(stack, 'Nordicway2-public', {
        deployOptions: {
            loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        },
        restApiName: 'Nordicway2 public API',
        endpointTypes: [nw2Props.private ? EndpointType.PRIVATE : EndpointType.REGIONAL],
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
                    conditions: getCondition(nw2Props),
                    principals: [
                        new iam.AnyPrincipal()
                    ]
                })
            ]
        })
    });
}