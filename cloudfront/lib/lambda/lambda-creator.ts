import {Stack,Duration } from '@aws-cdk/core';
import {Runtime, Function, InlineCode, AssetCode, Version} from '@aws-cdk/aws-lambda';
import {Role} from '@aws-cdk/aws-iam';

const fs = require('fs');

export enum LambdaType {
    WEATHERCAM_REDIRECT, GZIP_REQUIREMENT
}

export function createGzipRequirement(stack: Stack, edgeLambdaRole: Role): Version {
    const versionString = new Date().toISOString();
    const lambdaBody = fs.readFileSync('dist/lambda/lambda-gzip-requirement.js');
    const functionBody = lambdaBody.toString()
        .replace(/EXT_VERSION/gi, versionString);

    return createFunction(stack, edgeLambdaRole, 'gzip-requirement', functionBody, versionString);
}

export function createWeathercamRedirect(stack: Stack, edgeLambdaRole: Role, domainName: string, hostName: string): Version {
    const versionString = new Date().toISOString();
    const lambdaBody = fs.readFileSync('dist/lambda/lambda-redirect.js');
    const functionBody = lambdaBody.toString()
        .replace(/EXT_HOST_NAME/gi, hostName)
        .replace(/EXT_DOMAIN_NAME/gi, domainName)
        .replace(/EXT_VERSION/gi, versionString);

    return createFunction(stack, edgeLambdaRole, 'weathercam-redirect', functionBody, versionString);
}

export function createFunction(stack: Stack, edgeLambdaRole: Role, functionName: string, functionBody: string, versionString: string): Version {
    const edgeFunction = new Function(stack, functionName, {
        runtime: Runtime.NODEJS_12_X,
        memorySize: 128,
        code: new InlineCode(functionBody),
        handler: 'index.handler',
        role: edgeLambdaRole
    });

    return edgeFunction.addVersion(versionString);
}

export function createWriteToEsLambda(stack: Stack, env: string, lambdaRole: Role, elasticDomain: string, elasticAppName: string): Function {
    return new Function(stack, `${env}-lambda-forward`, {
        runtime: Runtime.NODEJS_12_X,
        role: lambdaRole,
        memorySize: 256,
        timeout: Duration.seconds(10),
        code: new AssetCode('dist/lambda'),
        handler: 'lambda-elastic.handler',
        environment: {
            APP_DOMAIN: elasticAppName,
            ELASTIC_DOMAIN: elasticDomain
        }
    });
}
