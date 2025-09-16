import {
  type IntegrationResponse,
  LambdaIntegration,
  PassthroughBehavior,
} from "aws-cdk-lib/aws-apigateway";
import type { IFunction } from "aws-cdk-lib/aws-lambda";
import { MediaType } from "../../types/mediatypes.js";
import { DigitrafficIntegrationResponse } from "../../runtime/digitraffic-integration-response.js";

type ParameterType =
  | "path"
  | "querystring"
  | "multivaluequerystring"
  | "context"
  | "header";

interface ApiParameter {
  type: ParameterType;
  name: string;
}

const VELOCITY_ALL_PARAMS = `#foreach($paramName in $params.keySet())
    #if( ! $paramMap.containsKey("_$paramName"))
        #set($tmp = $paramMap.put($paramName, $params[$paramName]))
    #end
#end`;

const VELOCITY_PASS_BODY =
  `#set($tmp = $paramMap.put('payload', $util.base64Encode($input.body)))`;

export class DigitrafficIntegration<T extends string> {
  readonly lambda: IFunction;
  readonly mediaType: MediaType;
  readonly parameters: ApiParameter[] = [];
  readonly deprecation: boolean = false;
  readonly sunset?: string;

  _passAllQueryParameters: boolean;
  _passBody: boolean;

  constructor(
    lambda: IFunction,
    mediaType: MediaType = MediaType.TEXT_PLAIN,
    deprecation: boolean = false,
    sunset?: string,
  ) {
    this.lambda = lambda;
    this.mediaType = mediaType;
    this.sunset = sunset;
    this.deprecation = deprecation;
    this._passAllQueryParameters = false;
    this._passBody = false;
  }

  passAllQueryParameters(): this {
    if (this.parameters.some((p) => p.type === "querystring")) {
      throw new Error("Can't add query parameters with pass all");
    }

    this._passAllQueryParameters = true;

    return this;
  }

  /**
   * Body is passed as an base64-encoded string, so broken input should't break anything.  You should
   * decode, parse and validate the input in the lambda.
   *
   * The encoded body will be passed to handler with name payload!!
   */
  passBody(): this {
    this._passBody = true;

    return this;
  }

  addParameter(type: ParameterType, name: string): this {
    if (name.startsWith("_")) {
      throw new Error("Parameters can't start with _");
    }

    this.parameters.push({ type, name });

    return this;
  }

  addPathParameter(...names: T[]): this {
    names.forEach((name) => this.addParameter("path", name));

    return this;
  }

  addQueryParameter(...names: T[]): this {
    if (this._passAllQueryParameters) {
      throw new Error("Can't add query parameters with pass all");
    }

    names.forEach((name) => this.addParameter("querystring", name));

    return this;
  }

  addMultiValueQueryParameter(...names: T[]): this {
    names.forEach((name) => this.addParameter("multivaluequerystring", name));

    return this;
  }

  /**
   * Note that context parameter values needs to be in json format as they will be parsed in template as json.
   * See createRequestTemplates below.
   * @param names for the parameters
   * @returns
   */
  addContextParameter(...names: T[]): this {
    names.forEach((name) => this.addParameter("context", name));

    return this;
  }

  /**
   * Do not use Authorization header as that will be consumed by ApiGW.
   * If Authorization header is needed, use lambda authorizers.
   * @param names for the headers
   */
  addHeaderParameter(...names: T[]): this {
    names.forEach((name) => this.addParameter("header", name));

    return this;
  }

  build(): LambdaIntegration {
    const integrationResponses = this.createResponses();

    return new LambdaIntegration(this.lambda, {
      proxy: false,
      integrationResponses,
      requestParameters: undefined,
      requestTemplates:
        this.parameters.length === 0 && !this._passAllQueryParameters
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
          `integration.request.${
            parameter.type.replace(
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

    this.parameters.forEach((parameter: ApiParameter) => {
      if (parameter.type === "context") {
        parameterAssignments.push(
          `#set($tmp = $paramMap.put('${parameter.name}', $util.escapeJavaScript($context.${parameter.name})))`,
        );
      } else if (parameter.type === "multivaluequerystring") {
        // make multivaluequerystring values to array
        parameterAssignments.push(
          `#set($tmp = $paramMap.put('_${parameter.name}', $method.request.multivaluequerystring.${parameter.name}))`,
        );
      } else if (parameter.type === "path") {
        parameterAssignments.push(
          `#set($tmp = $paramMap.put('${parameter.name}', $util.escapeJavaScript($input.params().path['${parameter.name}'])))`,
        );
      } else if (parameter.type === "header") {
        parameterAssignments.push(
          `#set($tmp = $paramMap.put('${parameter.name}', $util.escapeJavaScript($input.params().header['${parameter.name}'])))`,
        );
      } else {
        parameterAssignments.push(
          `#set($tmp = $paramMap.put('${parameter.name}', $util.escapeJavaScript($params['${parameter.name}'])))`,
        );
      }
    });

    // parameters starting with _ will be handled as multivalue querystring

    return {
      [MediaType.APPLICATION_JSON]: `
#set($paramMap = {})
#set($params = $input.params().get("querystring"))
${parameterAssignments.join("\n")}
${this._passAllQueryParameters ? VELOCITY_ALL_PARAMS : ""}
${this._passBody ? VELOCITY_PASS_BODY : ""}
{
#foreach($paramName in $paramMap.keySet())
#if( $paramName.substring(0, 1) != '_')
    "$paramName":"$paramMap.get($paramName)" #if($foreach.hasNext),\n#end
#else
    "$paramName.substring(1)": [#foreach($val in $paramMap.get($paramName))"$util.escapeJavaScript($val)"#if($foreach.hasNext),#end#end] #if($foreach.hasNext),\n#end
#end
#end
}`,
    };
  }

  createResponses(): IntegrationResponse[] {
    return [
      DigitrafficIntegrationResponse.ok(
        this.mediaType,
        this.deprecation,
        this.sunset,
      ),
    ];
  }
}
