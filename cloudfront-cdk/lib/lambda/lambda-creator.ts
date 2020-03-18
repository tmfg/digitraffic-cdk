import {Stack } from '@aws-cdk/core';
import {Runtime, Function, InlineCode} from '@aws-cdk/aws-lambda';
import {Role, ServicePrincipal, CompositePrincipal, ManagedPolicy} from '@aws-cdk/aws-iam';

const fs = require('fs');

export function createWeathercamRedirect(stack: Stack, domainName: string, hostName: string) {
    const versionString = new Date().toISOString();
    const lambdaBody = fs.readFileSync('dist/lambda/lambda-redirect.js');
    const functionBody = lambdaBody.toString()
        .replace(/EXT_HOST_NAME/gi, hostName)
        .replace(/EXT_DOMAIN_NAME/gi, domainName)
        .replace(/EXT_VERSION/gi, versionString);

    const redirectFunction = new Function(stack, 'weathercam-redirect', {
        runtime: Runtime.NODEJS_12_X,
        memorySize: 128,
        code: new InlineCode(functionBody),
        handler: 'index.handler',
        role: new Role(stack, 'edgeLambdaRole', {
            assumedBy:  new CompositePrincipal(
                new ServicePrincipal("lambda.amazonaws.com"),
                new ServicePrincipal("edgelambda.amazonaws.com"),
            ),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ]
        }),
    });

    return redirectFunction.addVersion(versionString);
}
