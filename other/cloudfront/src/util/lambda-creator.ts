import fs from "node:fs";
import { Duration } from "aws-cdk-lib";
import type { Role } from "aws-cdk-lib/aws-iam";
import type { Version } from "aws-cdk-lib/aws-lambda";
import {
  Function as AWSFunction,
  InlineCode,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";

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
  scope: Construct,
  edgeLambdaRole: Role,
): Version {
  const body = readBodyWithVersion("dist/lambda/lambda-gzip-requirement.cjs");

  return createVersionedFunction(
    scope,
    edgeLambdaRole,
    "gzip-requirement",
    body,
  );
}

export function createWeathercamRewrite(
  scope: Construct,
  edgeLambdaRole: Role,
  domainName: string,
  hostName: string,
): Version {
  const body = readBodyWithVersion("dist/lambda/lambda-weathercam-rewrite.cjs");
  const functionBody = body
    .toString()
    .replace(/EXT_HOST_NAME/gi, hostName)
    .replace(/EXT_DOMAIN_NAME/gi, domainName);

  return createVersionedFunction(
    scope,
    edgeLambdaRole,
    "weathercam-rewrite",
    functionBody,
  );
}

export function createHttpHeaders(
  scope: Construct,
  edgeLambdaRole: Role,
): Version {
  const body = readBodyWithVersion("dist/lambda/lambda-http-headers.cjs");

  return createVersionedFunction(scope, edgeLambdaRole, "http-headers", body);
}

export function createWeathercamHttpHeaders(
  scope: Construct,
  edgeLambdaRole: Role,
): Version {
  const body = readBodyWithVersion(
    "dist/lambda/lambda-weathercam-http-headers.cjs",
  );

  return createVersionedFunction(
    scope,
    edgeLambdaRole,
    "weathercam-http-headers",
    body,
  );
}

export function createIpRestriction(
  scope: Construct,
  edgeLambdaRole: Role,
  path: string,
  ipList: string,
): Version {
  const body = readBodyWithVersion("dist/lambda/lambda-ip-restriction.cjs");
  const functionBody = body.toString().replace(/EXT_IP/gi, ipList);

  return createVersionedFunction(
    scope,
    edgeLambdaRole,
    `ip-restriction-${path}`,
    functionBody,
  );
}

export function createLamRedirect(
  scope: Construct,
  edgeLambdaRole: Role,
  smRef: string,
): Version {
  const body = readBodyWithVersion("dist/lambda/lambda-lam-redirect.cjs");
  const edgeLambda = createFunction(
    scope,
    edgeLambdaRole,
    "lam-redirect",
    body,
  );

  // Allow read-access to secrets manager
  const secret = Secret.fromSecretCompleteArn(scope, "Secret", smRef);
  secret.grantRead(edgeLambda);
  return edgeLambda.currentVersion;
}

export function createLamHeaders(
  scope: Construct,
  edgeLambdaRole: Role,
): Version {
  const body = readBodyWithVersion("dist/lambda/lambda-lam-headers.cjs");

  return createVersionedFunction(scope, edgeLambdaRole, "lam-headers", body);
}

export function createFunction(
  scope: Construct,
  edgeLambdaRole: Role,
  functionName: string,
  functionBody: string,
): AWSFunction {
  return new AWSFunction(scope, functionName, {
    runtime: Runtime.NODEJS_24_X,
    memorySize: 128,
    code: new InlineCode(functionBody),
    handler: "index.handler",
    role: edgeLambdaRole,
    reservedConcurrentExecutions: 10,
    timeout: Duration.seconds(2),
  });
}

export function createVersionedFunction(
  scope: Construct,
  edgeLambdaRole: Role,
  functionName: string,
  functionBody: string,
): Version {
  return createFunction(scope, edgeLambdaRole, functionName, functionBody)
    .currentVersion;
}
