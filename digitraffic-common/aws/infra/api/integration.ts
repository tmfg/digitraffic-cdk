import {IntegrationResponse, LambdaIntegration, PassthroughBehavior} from "aws-cdk-lib/aws-apigateway";
import {IFunction} from "aws-cdk-lib/aws-lambda";
import {MediaType} from "../../types/mediatypes";
import {DigitrafficIntegrationResponse} from "../../runtime/digitraffic-integration-response";

type ParameterType = 'path' | 'querystring';

interface ApiParameter {
    type: ParameterType
    name: string
}

export class DigitrafficIntegration {
    readonly lambda: IFunction;
    readonly mediaType: MediaType;

    readonly parameters: ApiParameter[] = [];

    constructor(lambda: IFunction, mediaType = MediaType.TEXT_PLAIN) {
        this.lambda = lambda;
        this.mediaType = mediaType;
    }

    addPathParameter(...names: string[]): DigitrafficIntegration {
        names.forEach(name => this.parameters.push({type: 'path', name}));

        return this;
    }

    addQueryParameter(...names: string[]): DigitrafficIntegration {
        names.forEach(name => this.parameters.push({type: 'querystring', name}));

        return this;
    }

    build(): LambdaIntegration {
        const integrationResponses = this.createResponses();

        return new LambdaIntegration(this.lambda, {
            proxy: false,
            integrationResponses,
            requestParameters: this.parameters.length == 0 ? undefined : this.createRequestParameters(),
            requestTemplates: this.parameters.length == 0 ? undefined : this.createRequestTemplates(),
            passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
        });
    }

    createRequestParameters(): Record<string, string> {
        const requestParameters: Record<string, string> = {};

        this.parameters.forEach((parameter: ApiParameter) => {
            requestParameters[`integration.request.${parameter.type}.${parameter.name}`] = `method.request.${parameter.type}.${parameter.name}`;
        });

        return requestParameters;
    }

    createRequestTemplates(): Record<string, string> {
        const requestJson: Record<string, string> = {};

        this.parameters.forEach((parameter: ApiParameter) => {
            requestJson[parameter.name] = `$util.escapeJavaScript($input.params('${parameter.name}'))`;
        });

        return {
            [MediaType.APPLICATION_JSON]: JSON.stringify(requestJson),
        };
    }

    createResponses(): IntegrationResponse[] {
        return [DigitrafficIntegrationResponse.ok(this.mediaType)];
    }
}