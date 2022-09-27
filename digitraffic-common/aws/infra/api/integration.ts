import {IntegrationResponse, LambdaIntegration, PassthroughBehavior} from "aws-cdk-lib/aws-apigateway";
import {IFunction} from "aws-cdk-lib/aws-lambda";
import {MediaType} from "../../types/mediatypes";
import {DigitrafficIntegrationResponse} from "../../runtime/digitraffic-integration-response";

export class DigitrafficIntegration {
    readonly lambda: IFunction;
    readonly mediaType: MediaType;

    pathParameters: string[] = [];
    queryParameters: string[] = [];

    constructor(lambda: IFunction, mediaType = MediaType.TEXT_PLAIN) {
        this.lambda = lambda;
        this.mediaType = mediaType;
    }

    addPathParameter(path: string): DigitrafficIntegration {
        this.pathParameters.push(path);

        return this;
    }

    addQueryParameter(parameter: string): DigitrafficIntegration {
        this.queryParameters.push(parameter);

        return this;
    }

    build(): LambdaIntegration {
        const integrationResponses = this.createResponses();

        return new LambdaIntegration(this.lambda, {
            proxy: false,
            integrationResponses,
            requestParameters: this.createRequestParameters(),
            requestTemplates: this.createRequestTemplates(),
            passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
        });
    }

    createRequestParameters(): Record<string, string> {
        const requestParameters: Record<string, string> = {};

        this.pathParameters.forEach((parameter: string) => {
            requestParameters[`integration.request.path.${parameter}`] = `method.request.path.${parameter}`;
        });

        this.queryParameters.forEach((parameter: string) => {
            requestParameters[`integration.request.querystring.${parameter}`] = `method.request.querystring.${parameter}`;
        });

        return requestParameters;
    }

    createRequestTemplates(): Record<string, string> {
        const requestJson: Record<string, string> = {};

        this.pathParameters.forEach((parameter: string) => {
            requestJson[parameter] = `$util.escapeJavaScript($input.params('${parameter}'))`;
        });

        this.queryParameters.forEach((parameter: string) => {
            requestJson[parameter] = `$util.escapeJavaScript($input.params('${parameter}'))`;
        });

        return {
            [MediaType.APPLICATION_JSON]: JSON.stringify(requestJson),
        };
    }

    createResponses(): IntegrationResponse[] {
        return [DigitrafficIntegrationResponse.ok(this.mediaType)];
    }
}