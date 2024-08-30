import { type IntegrationResponse, LambdaIntegration, PassthroughBehavior } from "aws-cdk-lib/aws-apigateway";
import type { IFunction } from "aws-cdk-lib/aws-lambda";
import { MediaType } from "../../types/mediatypes.js";
import { DigitrafficIntegrationResponse } from "../../runtime/digitraffic-integration-response.js";

type ParameterType = "path" | "querystring" | "multivaluequerystring" | "context" | "header";

interface ApiParameter {
    type: ParameterType;
    name: string;
}

const VELOCITY_ALL_PARAMS = `#set($params = $input.params().get("querystring"))
#foreach($paramName in $params.keySet())
  "$paramName":"$util.escapeJavaScript($params.get($paramName))" #if($foreach.hasNext),#end
#end
`;

export class DigitrafficIntegration<T extends string> {
    readonly lambda: IFunction;
    readonly mediaType: MediaType;
    readonly parameters: ApiParameter[] = [];
    readonly sunset?: string;

    _passAllQueryParameters: boolean;

    constructor(
        lambda: IFunction,
        mediaType: MediaType = MediaType.TEXT_PLAIN,
        sunset?: string,
    ) {
        this.lambda = lambda;
        this.mediaType = mediaType;
        this.sunset = sunset;
        this._passAllQueryParameters = false;
    }

    passAllQueryParameters(): this {
        if (this.parameters.some((p) => p.type === "querystring")) {
            throw new Error("Can't add query parameters with pass all");
        }

        this._passAllQueryParameters = true;

        return this;
    }

    addPathParameter(...names: T[]): this {
        names.forEach((name) => this.parameters.push({ type: "path", name }));

        return this;
    }

    addQueryParameter(...names: T[]): this {
        if (this._passAllQueryParameters) throw new Error("Can't add query parameters with pass all");

        names.forEach((name) => this.parameters.push({ type: "querystring", name }));
        return this;
    }

    addMultiValueQueryParameter(...names: T[]): this {
        names.forEach((name) => this.parameters.push({ type: "multivaluequerystring", name }));
        return this;
    }

    /**
     * Note that context parameter values needs to be in json format as they will be parsed in template as json.
     * See createRequestTemplates below.
     * @param names for the parameters
     * @returns
     */
    addContextParameter(...names: T[]): this {
        names.forEach((name) => this.parameters.push({ type: "context", name }));

        return this;
    }

    /**
     * Do not use Authorization header as that will be consumed by ApiGW.
     * If Authorization header is needed, use lambda authorizers.
     * @param names for the headers
     */
    addHeaderParameter(...names: T[]): this {
        names.forEach((name) => this.parameters.push({ type: "header", name }));

        return this;
    }

    build(): LambdaIntegration {
        const integrationResponses = this.createResponses();

        return new LambdaIntegration(this.lambda, {
            proxy: false,
            integrationResponses,
            requestParameters: undefined,
            requestTemplates: this.parameters.length === 0 && !this._passAllQueryParameters
                ? undefined
                : this.createRequestTemplates(),
            passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
        });
    }

    createRequestParameters(): Record<string, string> {
        const requestParameters: Record<string, string> = {};

        // filter out context parameters
        this.parameters
            .filter((parameter) => parameter.type !== "context")
            .forEach((parameter: ApiParameter) => {
                requestParameters[
                    `integration.request.${parameter.type.replace(
                        "multivaluequerystring",
                        "querystring",
                    )
                    }.${parameter.name}`
                ] = `method.request.${parameter.type}.${parameter.name}`;
            });

        return requestParameters;
    }

    createRequestTemplates(): Record<string, string> {
        const parameterAssignments: string[] = [];

        if (this._passAllQueryParameters) {
            parameterAssignments.push(VELOCITY_ALL_PARAMS);
        }

        this.parameters.forEach((parameter: ApiParameter) => {
            if (parameter.type === "context") {
                parameterAssignments.push(`"${parameter.name}":"$util.parseJson($context.${parameter.name}"`);
            } else if (parameter.type === "multivaluequerystring") {
                // make multivaluequerystring values to array
                parameterAssignments.push(
                    `"${parameter.name}":[#foreach($val in $method.request.multivaluequerystring.get('${parameter.name}'))"$util.escapeJavaScript($val)"#if($foreach.hasNext),#end#end]`,
                );
            } else {
                parameterAssignments.push(
                    `"${parameter.name}":"$util.escapeJavaScript($input.params('${parameter.name}'))"`,
                );
            }
        });

        return {
            [MediaType.APPLICATION_JSON]: `{
    ${parameterAssignments.length > 0 ? parameterAssignments.join(",\n    ") + "\n" : ""}}`,
        };
    }

    createResponses(): IntegrationResponse[] {
        return [DigitrafficIntegrationResponse.ok(this.mediaType, this.sunset)];
    }
}
