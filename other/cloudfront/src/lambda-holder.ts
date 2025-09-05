import type { IVersion } from "aws-cdk-lib/aws-lambda";
import type * as Cloudfront from "aws-cdk-lib/aws-cloudfront";
import type {
  FunctionAssociation,
  LambdaFunctionAssociation,
} from "aws-cdk-lib/aws-cloudfront";
import {
  FunctionEventType,
  LambdaEdgeEventType,
} from "aws-cdk-lib/aws-cloudfront";
import { LambdaType } from "./util/lambda-creator.js";
import { FunctionType } from "./util/function-creator.js";

export class LambdaHolder {
  readonly lambdas: Record<number, IVersion> = {};
  readonly functions: Record<number, Cloudfront.Function> = {};
  readonly restrictions: Record<string, IVersion> = {};
  readonly redirects: Record<string, Cloudfront.Function> = {};

  addLambda(lambdaType: LambdaType, version: IVersion): void {
    this.lambdas[lambdaType] = version;
  }

  addFunction(
    functionType: FunctionType,
    cloudfrontFunction: Cloudfront.Function,
  ): void {
    this.functions[functionType] = cloudfrontFunction;
  }

  addRestriction(name: string, version: IVersion): void {
    this.restrictions[name] = version;
  }

  addRedirect(name: string, version: Cloudfront.Function): void {
    this.redirects[name] = version;
  }

  getFunctionAssociation(functionType: FunctionType): FunctionAssociation {
    return {
      eventType: LambdaHolder.getFunctionEventType(functionType),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      function: this.functions[functionType]!,
    };
  }

  getLambdaAssociation(lambdaType: LambdaType): LambdaFunctionAssociation {
    return {
      eventType: LambdaHolder.getLambdaEventType(lambdaType),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      lambdaFunction: this.lambdas[lambdaType]!,
    };
  }

  getRestriction(name: string): LambdaFunctionAssociation {
    return {
      eventType: LambdaEdgeEventType.ORIGIN_REQUEST,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      lambdaFunction: this.restrictions[name]!,
    };
  }

  getRedirect(name: string): FunctionAssociation {
    return {
      eventType: FunctionEventType.VIEWER_REQUEST,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      function: this.redirects[name]!,
    };
  }

  private static getFunctionEventType(
    functionType: FunctionType,
  ): FunctionEventType {
    switch (functionType) {
      case FunctionType.REDIRECT:
      case FunctionType.INDEX_HTML:
      case FunctionType.HISTORY_REDIRECT:
      case FunctionType.PATH_REWRITE:
        return FunctionEventType.VIEWER_REQUEST;
      case FunctionType.HTTP_HEADERS:
        return FunctionEventType.VIEWER_RESPONSE;
    }
  }

  private static getLambdaEventType(
    lambdaType: LambdaType,
  ): LambdaEdgeEventType {
    switch (lambdaType) {
      case LambdaType.WEATHERCAM_REDIRECT:
      case LambdaType.IP_RESTRICTION:
      case LambdaType.GZIP_REQUIREMENT:
      case LambdaType.LAM_REDIRECT:
        return LambdaEdgeEventType.ORIGIN_REQUEST;
      case LambdaType.LAM_HEADERS:
        return LambdaEdgeEventType.ORIGIN_RESPONSE;
      case LambdaType.HTTP_HEADERS:
      case LambdaType.WEATHERCAM_HTTP_HEADERS:
        return LambdaEdgeEventType.VIEWER_RESPONSE;
    }
  }
}
