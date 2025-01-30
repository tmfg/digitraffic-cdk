import type { Stack } from "aws-cdk-lib";
import * as Cloudfront from "aws-cdk-lib/aws-cloudfront";
import fs from "node:fs";

export enum FunctionType {
  INDEX_HTML,
  HISTORY_REDIRECT,
  REDIRECT,
}

function readFunctionBody(fileName: string): string {
  const body = fs.readFileSync(fileName);

  // remove export needed for tests, but not allowed for cloudfront functions
  if (body.includes("exports.handler")) {
    return body.toString().substring(0, body.indexOf("exports.handler"));
  }

  return body.toString();
}

export function createIndexHtml(stack: Stack): Cloudfront.Function {
  const body = readFunctionBody("dist/lambda/function-index-html.cjs");

  return createCloudfrontFunction(stack, "index-html", body);
}

export function createHistoryPath(stack: Stack): Cloudfront.Function {
  const body = readFunctionBody("dist/lambda/function-redirect-history.cjs");

  return createCloudfrontFunction(stack, "history-redirect", body);
}

export function createRedirectFunction(
  stack: Stack,
  redirectUrl: string,
): Cloudfront.Function {
  const body = readFunctionBody("dist/lambda/function-redirect.cjs")
    .replace(/EXT_REDIRECT_URL/gi, redirectUrl);

  return createCloudfrontFunction(stack, "redirect-function", body);
}

export function createCloudfrontFunction(
  stack: Stack,
  functionName: string,
  functionBody: string,
): Cloudfront.Function {
  return new Cloudfront.Function(stack, functionName, {
    code: Cloudfront.FunctionCode.fromInline(functionBody),
    runtime: Cloudfront.FunctionRuntime.JS_2_0,
  });
}
