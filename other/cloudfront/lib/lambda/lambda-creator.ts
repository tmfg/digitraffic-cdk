import { Duration, Stack } from "aws-cdk-lib";
import { Function, InlineCode, Runtime } from "aws-cdk-lib/aws-lambda";
import { Role } from "aws-cdk-lib/aws-iam";
import * as Cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as fs from "fs";

export enum LambdaType {
    WEATHERCAM_REDIRECT,
    GZIP_REQUIREMENT,
    HTTP_HEADERS,
    IP_RESTRICTION,
    WEATHERCAM_HTTP_HEADERS,
}

export enum FunctionType {
    INDEX_HTML,
}

function readBodyWithVersion(fileName: string) {
    const versionString = new Date().toISOString();
    const body = fs.readFileSync(fileName);

    return body.toString().replace(/EXT_VERSION/gi, versionString);
}

export function createGzipRequirement(stack: Stack, edgeLambdaRole: Role) {
    const body = readBodyWithVersion("dist/lambda/lambda-gzip-requirement.js");

    return createFunction(stack, edgeLambdaRole, "gzip-requirement", body);
}

export function createWeathercamRedirect(
    stack: Stack,
    edgeLambdaRole: Role,
    domainName: string,
    hostName: string
) {
    const body = readBodyWithVersion("dist/lambda/lambda-redirect.js");
    const functionBody = body
        .toString()
        .replace(/EXT_HOST_NAME/gi, hostName)
        .replace(/EXT_DOMAIN_NAME/gi, domainName);

    return createFunction(
        stack,
        edgeLambdaRole,
        "weathercam-redirect",
        functionBody
    );
}

export function createHttpHeaders(stack: Stack, edgeLambdaRole: Role) {
    const body = readBodyWithVersion("dist/lambda/lambda-http-headers.js");

    return createFunction(stack, edgeLambdaRole, "http-headers", body);
}

export function createWeathercamHttpHeaders(
    stack: Stack,
    edgeLambdaRole: Role
) {
    const body = readBodyWithVersion(
        "dist/lambda/lambda-weathercam-http-headers.js"
    );

    return createFunction(
        stack,
        edgeLambdaRole,
        "weathercam-http-headers",
        body
    );
}

export function createIndexHtml(stack: Stack, edgeLambdaRole: Role) {
    const body = readBodyWithVersion("lib/lambda/lambda-index-html.js");

    return createCloudfrontFunction(stack, "index-html", body);
}

export function createIpRestriction(
    stack: Stack,
    edgeLambdaRole: Role,
    path: string,
    ipList: string
) {
    const body = readBodyWithVersion("dist/lambda/lambda-ip-restriction.js");
    const functionBody = body.toString().replace(/EXT_IP/gi, ipList);

    return createFunction(
        stack,
        edgeLambdaRole,
        `ip-restriction-${path}`,
        functionBody
    );
}

export function createCloudfrontFunction(
    stack: Stack,
    functionName: string,
    functionBody: string
) {
    const cloudfrontFunction = new Cloudfront.Function(stack, functionName, {
        code: Cloudfront.FunctionCode.fromInline(functionBody),
    });

    return cloudfrontFunction;
}

export function createFunction(
    stack: Stack,
    edgeLambdaRole: Role,
    functionName: string,
    functionBody: string
) {
    const edgeFunction = new Function(stack, functionName, {
        runtime: Runtime.NODEJS_16_X,
        memorySize: 128,
        code: new InlineCode(functionBody),
        handler: "index.handler",
        role: edgeLambdaRole,
        reservedConcurrentExecutions: 10,
        timeout: Duration.seconds(2),
    });

    return edgeFunction.currentVersion;
}
