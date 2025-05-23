import { Duration, type Stack } from "aws-cdk-lib";
import * as Cloudfront from "aws-cdk-lib/aws-cloudfront";
import type { Role } from "aws-cdk-lib/aws-iam";
import {
  Function as AWSFunction,
  InlineCode,
  Runtime,
  type Version,
} from "aws-cdk-lib/aws-lambda";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import fs from "node:fs";

export enum LambdaType {
  WEATHERCAM_REDIRECT,
  GZIP_REQUIREMENT,
  HTTP_HEADERS,
  IP_RESTRICTION,
  WEATHERCAM_HTTP_HEADERS,
  LAM_REDIRECT,
  LAM_HEADERS,
}

function readBodyWithVersion(fileName: string): string {
  const versionString = new Date().toISOString();
  const body = fs.readFileSync(fileName);

  return body.toString().replace(/EXT_VERSION/gi, versionString);
}

export function createGzipRequirement(
  stack: Stack,
  edgeLambdaRole: Role,
): Version {
  const body = readBodyWithVersion("dist/lambda/lambda-gzip-requirement.cjs");

  return createVersionedFunction(
    stack,
    edgeLambdaRole,
    "gzip-requirement",
    body,
  );
}

export function createWeathercamRedirect(
  stack: Stack,
  edgeLambdaRole: Role,
  domainName: string,
  hostName: string,
): Version {
  const body = readBodyWithVersion("dist/lambda/lambda-redirect.cjs");
  const functionBody = body
    .toString()
    .replace(/EXT_HOST_NAME/gi, hostName)
    .replace(/EXT_DOMAIN_NAME/gi, domainName);

  return createVersionedFunction(
    stack,
    edgeLambdaRole,
    "weathercam-redirect",
    functionBody,
  );
}

export function createHttpHeaders(stack: Stack, edgeLambdaRole: Role): Version {
  const body = readBodyWithVersion("dist/lambda/lambda-http-headers.cjs");

  return createVersionedFunction(stack, edgeLambdaRole, "http-headers", body);
}

export function createWeathercamHttpHeaders(
  stack: Stack,
  edgeLambdaRole: Role,
): Version {
  const body = readBodyWithVersion(
    "dist/lambda/lambda-weathercam-http-headers.cjs",
  );

  return createVersionedFunction(
    stack,
    edgeLambdaRole,
    "weathercam-http-headers",
    body,
  );
}

export function createIpRestriction(
  stack: Stack,
  edgeLambdaRole: Role,
  path: string,
  ipList: string,
): Version {
  const body = readBodyWithVersion("dist/lambda/lambda-ip-restriction.cjs");
  const functionBody = body.toString().replace(/EXT_IP/gi, ipList);

  return createVersionedFunction(
    stack,
    edgeLambdaRole,
    `ip-restriction-${path}`,
    functionBody,
  );
}

export function createLamRedirect(
  stack: Stack,
  edgeLambdaRole: Role,
  smRef: string,
): Version {
  const body = readBodyWithVersion("dist/lambda/lambda-lam-redirect.cjs");
  const edgeLambda = createFunction(
    stack,
    edgeLambdaRole,
    "lam-redirect",
    body,
  );

  // Allow read-access to secrets manager
  const secret = Secret.fromSecretCompleteArn(stack, "Secret", smRef);
  secret.grantRead(edgeLambda);
  return edgeLambda.currentVersion;
}

export function createLamHeaders(stack: Stack, edgeLambdaRole: Role): Version {
  const body = readBodyWithVersion("dist/lambda/lambda-lam-headers.cjs");

  return createVersionedFunction(stack, edgeLambdaRole, "lam-headers", body);
}

export function createFunction(
  stack: Stack,
  edgeLambdaRole: Role,
  functionName: string,
  functionBody: string,
): AWSFunction {
  return new AWSFunction(stack, functionName, {
    runtime: Runtime.NODEJS_22_X,
    memorySize: 128,
    code: new InlineCode(functionBody),
    handler: "index.handler",
    role: edgeLambdaRole,
    reservedConcurrentExecutions: 10,
    timeout: Duration.seconds(2),
  });
}

export function createVersionedFunction(
  stack: Stack,
  edgeLambdaRole: Role,
  functionName: string,
  functionBody: string,
): Version {
  return createFunction(stack, edgeLambdaRole, functionName, functionBody)
    .currentVersion;
}
