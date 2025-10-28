import type { Function as CloudfrontFunction } from "aws-cdk-lib/aws-cloudfront";
import type { Construct } from "constructs";
import type { Stack } from "aws-cdk-lib";
import {
  createHttpHeadersFunction,
  createIndexHtml,
  createPathRewriteFunction,
  createRedirectFunction,
} from "./function-creator.js";

export class EdgeFunctionFactory {
  readonly _functionMap: Record<string, CloudfrontFunction> = {};

  readonly _scope: Construct;

  constructor(stack: Stack) {
    this._scope = stack;
  }

  getFunction(
    key: string,
    creator: () => CloudfrontFunction,
  ): CloudfrontFunction {
    if (!this._functionMap[key]) {
      this._functionMap[key] = creator();
    }

    return this._functionMap[key];
  }

  getIndexHtmlFunction(): CloudfrontFunction {
    return this.getFunction("index-html", () => createIndexHtml(this._scope));
  }

  getRedirectFunction(redirectUrl: string): CloudfrontFunction {
    const key = `redirect_${redirectUrl}`;

    return this.getFunction(
      key,
      () => createRedirectFunction(this._scope, redirectUrl),
    );
  }

  getPathRewriteFunction(pathRemoveCount: number): CloudfrontFunction {
    const key = `pathRewrite_${pathRemoveCount}`;

    return this.getFunction(
      key,
      () => createPathRewriteFunction(this._scope, pathRemoveCount),
    );
  }

  getHttpHeadersFunction(): CloudfrontFunction {
    return this.getFunction(
      "http-headers-function",
      () => createHttpHeadersFunction(this._scope),
    );
  }
}
