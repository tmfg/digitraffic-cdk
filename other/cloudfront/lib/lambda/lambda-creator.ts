import {Duration, Stack} from 'aws-cdk-lib';
import {Function, InlineCode, Runtime} from 'aws-cdk-lib/aws-lambda';
import {Role} from 'aws-cdk-lib/aws-iam';
import * as Cloudfront from "aws-cdk-lib/aws-cloudfront";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

export enum LambdaType {
    WEATHERCAM_REDIRECT, GZIP_REQUIREMENT, HTTP_HEADERS, IP_RESTRICTION
}

export enum FunctionType {
    INDEX_HTML
}

export function createGzipRequirement(stack: Stack, edgeLambdaRole: Role) {
    const versionString = new Date().toISOString();
    const lambdaBody = fs.readFileSync('dist/lambda/lambda-gzip-requirement.js');
    const functionBody = lambdaBody.toString()
        .replace(/EXT_VERSION/gi, versionString);

    return createFunction(stack, edgeLambdaRole, 'gzip-requirement', functionBody);
}

export function createWeathercamRedirect(stack: Stack, edgeLambdaRole: Role, domainName: string, hostName: string) {
    const versionString = new Date().toISOString();
    const lambdaBody = fs.readFileSync('dist/lambda/lambda-redirect.js');
    const functionBody = lambdaBody.toString()
        .replace(/EXT_HOST_NAME/gi, hostName)
        .replace(/EXT_DOMAIN_NAME/gi, domainName)
        .replace(/EXT_VERSION/gi, versionString);

    return createFunction(stack, edgeLambdaRole, 'weathercam-redirect', functionBody);
}

export function createHttpHeaders(stack: Stack, edgeLambdaRole: Role) {
    const versionString = new Date().toISOString();
    const lambdaBody = fs.readFileSync('dist/lambda/lambda-http-headers.js');
    const functionBody = lambdaBody.toString()
        .replace(/EXT_VERSION/gi, versionString);

    return createFunction(stack, edgeLambdaRole, 'http-headers', functionBody);
}

export function createIndexHtml(stack: Stack, edgeLambdaRole: Role) {
    const versionString = new Date().toISOString();
    const lambdaBody = fs.readFileSync('lib/lambda/lambda-index-html.js');
    const functionBody = lambdaBody.toString()
        .replace(/EXT_VERSION/gi, versionString);

    return createCloudfrontFunction(stack, 'index-html', functionBody);
}

export function createIpRestriction(stack: Stack, edgeLambdaRole: Role, path: string, ipList: string) {
    const versionString = new Date().toISOString();
    const lambdaBody = fs.readFileSync('dist/lambda/lambda-ip-restriction.js');
    const functionBody = lambdaBody.toString()
        .replace(/EXT_IP/gi, ipList)
        .replace(/EXT_VERSION/gi, versionString);

    return createFunction(stack, edgeLambdaRole, `ip-restriction-${path}`, functionBody);
}

export function createCloudfrontFunction(stack: Stack, functionName: string, functionBody: string) {
    const cloudfrontFunction = new Cloudfront.Function(stack, functionName, {
        //        runtime: Runtime.NODEJS_14_X,
        //        handler: 'index.handler',
        code: Cloudfront.FunctionCode.fromInline(functionBody),
    });

    return cloudfrontFunction;
}

export function createFunction(stack: Stack, edgeLambdaRole: Role, functionName: string, functionBody: string) {
    const edgeFunction = new Function(stack, functionName, {
        runtime: Runtime.NODEJS_14_X,
        memorySize: 128,
        code: new InlineCode(functionBody),
        handler: 'index.handler',
        role: edgeLambdaRole,
        reservedConcurrentExecutions: 10,
        timeout: Duration.seconds(2),
    });

    return edgeFunction.currentVersion;
}

