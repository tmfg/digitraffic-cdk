import {Stack} from 'aws-cdk-lib';
import {Function, InlineCode, Runtime, Version} from 'aws-cdk-lib/aws-lambda';
import {Role} from 'aws-cdk-lib/aws-iam';

const fs = require('fs');

export enum LambdaType {
    WEATHERCAM_REDIRECT, GZIP_REQUIREMENT, HTTP_HEADERS, IP_RESTRICTION
}

export function createGzipRequirement(stack: Stack, edgeLambdaRole: Role): Version {
    const versionString = new Date().toISOString();
    const lambdaBody = fs.readFileSync('dist/lambda/lambda-gzip-requirement.js');
    const functionBody = lambdaBody.toString()
        .replace(/EXT_VERSION/gi, versionString);

    return createFunction(stack, edgeLambdaRole, 'gzip-requirement', functionBody);
}

export function createWeathercamRedirect(stack: Stack, edgeLambdaRole: Role, domainName: string, hostName: string): Version {
    const versionString = new Date().toISOString();
    const lambdaBody = fs.readFileSync('dist/lambda/lambda-redirect.js');
    const functionBody = lambdaBody.toString()
        .replace(/EXT_HOST_NAME/gi, hostName)
        .replace(/EXT_DOMAIN_NAME/gi, domainName)
        .replace(/EXT_VERSION/gi, versionString);

    return createFunction(stack, edgeLambdaRole, 'weathercam-redirect', functionBody);
}

export function createHttpHeaders(stack: Stack, edgeLambdaRole: Role): Version {
    const versionString = new Date().toISOString();
    const lambdaBody = fs.readFileSync('dist/lambda/lambda-http-headers.js');
    const functionBody = lambdaBody.toString()
        .replace(/EXT_VERSION/gi, versionString);

    return createFunction(stack, edgeLambdaRole, 'http-headers', functionBody);
}

export function createIpRestriction(stack: Stack, edgeLambdaRole: Role, path: string, ipList: string): Version {
    const versionString = new Date().toISOString();
    const lambdaBody = fs.readFileSync('dist/lambda/lambda-ip-restriction.js');
    const functionBody = lambdaBody.toString()
        .replace(/EXT_IP/gi, ipList)
        .replace(/EXT_VERSION/gi, versionString);

    return createFunction(stack, edgeLambdaRole, `ip-restriction-${path}`, functionBody);
}

export function createFunction(stack: Stack, edgeLambdaRole: Role, functionName: string, functionBody: string): Version {
    const edgeFunction = new Function(stack, functionName, {
        runtime: Runtime.NODEJS_14_X,
        memorySize: 128,
        code: new InlineCode(functionBody),
        handler: 'index.handler',
        role: edgeLambdaRole,
    });

    return edgeFunction.currentVersion;
}

