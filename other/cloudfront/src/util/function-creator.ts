import { createHash } from "node:crypto";
import fs from "node:fs";
import {
  Function as CloudfrontFunction,
  FunctionCode,
  FunctionRuntime,
} from "aws-cdk-lib/aws-cloudfront";
import type { Construct } from "constructs";

export enum FunctionType {
  INDEX_HTML,
  REDIRECT,
  PATH_REWRITE,
  DIRECTORY_INDEX,
  HTTP_HEADERS,
}

function readFunctionBody(fileName: string): string {
  const body = fs.readFileSync(fileName);

  // remove export needed for tests, but not allowed for cloudfront functions
  if (body.includes("exports.handler")) {
    return body.toString().substring(0, body.indexOf("exports.handler"));
  }

  return body.toString();
}

function shortHash(value: string): string {
  return createHash("sha256").update(value).digest("hex").substring(0, 8);
}

export function createIndexHtml(scope: Construct): CloudfrontFunction {
  const body = readFunctionBody("dist/lambda/function-index-html.cjs");

  return createCloudfrontFunction(scope, "index-html", body);
}

export function createRedirectFunction(
  scope: Construct,
  redirectUrl: string,
): CloudfrontFunction {
  const body = readFunctionBody("dist/lambda/function-redirect.cjs").replace(
    /EXT_REDIRECT_URL/gi,
    redirectUrl,
  );

  // A stack can hold several redirect behaviors, each with its own target url.
  return createCloudfrontFunction(
    scope,
    `redirect-function-${shortHash(redirectUrl)}`,
    body,
  );
}

export function createPathRewriteFunction(
  scope: Construct,
  pathRemoveCount: number,
): CloudfrontFunction {
  const body = readFunctionBody("dist/lambda/function-rewrite-uri.cjs").replace(
    /EXT_PATHS_TO_REMOVE/gi,
    pathRemoveCount.toString(),
  );

  return createCloudfrontFunction(
    scope,
    `rewrite-uri-function-${pathRemoveCount}`,
    body,
  );
}

export function createHttpHeadersFunction(
  scope: Construct,
): CloudfrontFunction {
  const body = readFunctionBody("dist/lambda/function-http-headers.cjs");

  return createCloudfrontFunction(scope, "http-headers-function", body);
}

export function createDirectoryIndexFunction(
  scope: Construct,
  pathRemoveCount: number,
): CloudfrontFunction {
  const body = readFunctionBody(
    "dist/lambda/function-directory-index.cjs",
  ).replace(/EXT_PATHS_TO_REMOVE/gi, pathRemoveCount.toString());

  return createCloudfrontFunction(
    scope,
    `directory-index-function-${pathRemoveCount}`,
    body,
  );
}

// let's make a chain of dependencies from the functions, as AWS won't allow deploying many functions at the same time!
let lastFunction: CloudfrontFunction;

export function createCloudfrontFunction(
  scope: Construct,
  functionName: string,
  functionBody: string,
): CloudfrontFunction {
  const newFunction = new CloudfrontFunction(scope, functionName, {
    code: FunctionCode.fromInline(functionBody),
    runtime: FunctionRuntime.JS_2_0,
  });

  if (lastFunction) {
    newFunction.node.addDependency(lastFunction);
  }

  lastFunction = newFunction;

  return newFunction;
}
