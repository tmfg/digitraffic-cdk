import { IVersion } from "aws-cdk-lib/aws-lambda";
import * as Cloudfront from "aws-cdk-lib/aws-cloudfront";
import {
    FunctionEventType,
    LambdaEdgeEventType,
    LambdaFunctionAssociation
} from "aws-cdk-lib/aws-cloudfront";
import { FunctionType, LambdaType } from "./lambda/lambda-creator";
import { FunctionAssociation } from "aws-cdk-lib/aws-cloudfront/lib/function";

export class LambdaHolder {
    readonly lambdas: Record<number, IVersion> = {};
    readonly functions: Record<number, Cloudfront.Function> = {};
    readonly restrictions: Record<string, IVersion> = {};

    addLambda(lambdaType: LambdaType, version: IVersion): void {
        this.lambdas[lambdaType] = version;
    }

    addFunction(functionType: FunctionType, cloudfrontFunction: Cloudfront.Function): void {
        this.functions[functionType] = cloudfrontFunction;
    }

    addRestriction(name: string, version: IVersion): void {
        this.restrictions[name] = version;
    }

    getFunctionAssociation(functionType: FunctionType): FunctionAssociation {
        return {
            eventType: LambdaHolder.getFunctionEventType(functionType),
            function: this.functions[functionType]
        };
    }

    getLambdaAssociation(lambdaType: LambdaType): LambdaFunctionAssociation {
        return {
            eventType: LambdaHolder.getLambdaEventType(lambdaType),
            lambdaFunction: this.lambdas[lambdaType]
        };
    }

    getRestriction(name: string): LambdaFunctionAssociation {
        return {
            eventType: LambdaEdgeEventType.ORIGIN_REQUEST,
            lambdaFunction: this.restrictions[name]
        };
    }

    private static getFunctionEventType(functionType: FunctionType): FunctionEventType {
        switch (functionType) {
            case FunctionType.INDEX_HTML:
                return FunctionEventType.VIEWER_REQUEST;
            case FunctionType.HISTORY_REDIRECT:
                return FunctionEventType.VIEWER_REQUEST;
        }
    }

    private static getLambdaEventType(lambdaType: LambdaType): LambdaEdgeEventType {
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
