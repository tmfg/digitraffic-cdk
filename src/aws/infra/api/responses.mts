import {
    InternalServerErrorResponseTemplate,
    XmlResponseTemplate,
    NotFoundResponseTemplate,
    BadRequestResponseTemplate,
} from "./response.mjs";
import {
    LambdaIntegration,
    type MethodResponse,
    type IntegrationResponse,
    PassthroughBehavior,
  type IModel
} from "aws-cdk-lib/aws-apigateway";
import { Function as AWSFunction } from "aws-cdk-lib/aws-lambda";
import {
    BAD_REQUEST_MESSAGE,
    ERROR_MESSAGE,
    NOT_FOUND_MESSAGE,
} from "../../types/errors.mjs";
import { MediaType } from "../../types/mediatypes.mjs";

/// @deprecated
export const RESPONSE_200_OK: IntegrationResponse = {
    statusCode: "200",
};

/// @deprecated
export const RESPONSE_400_BAD_REQUEST: IntegrationResponse = {
    statusCode: "400",
    selectionPattern: BAD_REQUEST_MESSAGE,
    responseTemplates: BadRequestResponseTemplate,
};

/// @deprecated
export const RESPONSE_500_SERVER_ERROR: IntegrationResponse = {
    statusCode: "500",
    selectionPattern: ERROR_MESSAGE,
    responseTemplates: InternalServerErrorResponseTemplate,
};

/// @deprecated
const RESPONSE_XML = {
    responseTemplates: XmlResponseTemplate,
};

/// @deprecated
export const RESPONSE_CORS_INTEGRATION = {
    responseParameters: {
        "method.response.header.Access-Control-Allow-Origin": "'*'",
    },
};

/// @deprecated
export const RESPONSE_404_NOT_FOUND = {
    statusCode: "404",
    selectionPattern: NOT_FOUND_MESSAGE,
    responseTemplates: NotFoundResponseTemplate,
};

/**
 * @deprecated Use DigitrafficMethodResponse
 */
export function methodResponse(
    status: string,
    contentType: MediaType,
    model: IModel,
    parameters?: Record<string, boolean>
): MethodResponse {
    return {
        statusCode: status,
        responseModels: {
            [contentType]: model,
        },
        responseParameters: parameters ?? {},
    };
}

interface IntegrationOptions {
    // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
    requestParameters?: { [dest: string]: string };
    // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
    requestTemplates?: { [contentType: string]: string };
    responses?: IntegrationResponse[];
    disableCors?: boolean;
    xml?: boolean;
    passthroughBehavior?: PassthroughBehavior;
}

/**
 * Creates a default Lambda integration for a REST API resource _root_
 * @param lambdaFunction The Lambda function
 * @param options Options
 *
 * @deprecated Use DigitrafficIntegration
 */
export function defaultIntegration(
    lambdaFunction: AWSFunction,
    options?: IntegrationOptions
): LambdaIntegration {
    return new LambdaIntegration(lambdaFunction, {
        proxy: false,
        integrationResponses: options?.responses ?? [
            getResponse(RESPONSE_200_OK, options),
            getResponse(RESPONSE_400_BAD_REQUEST, options),
            getResponse(RESPONSE_404_NOT_FOUND, options),
            getResponse(RESPONSE_500_SERVER_ERROR, options),
        ],
        requestParameters: options?.requestParameters ?? {},
        requestTemplates: options?.requestTemplates ?? {},
        passthroughBehavior:
            options?.passthroughBehavior ?? PassthroughBehavior.WHEN_NO_MATCH,
    });
}

export function getResponse(
    response: IntegrationResponse,
    options?: IntegrationOptions
): IntegrationResponse {
    if (options?.xml) {
        response = { ...response, ...RESPONSE_XML };
    }
    if (!options?.disableCors) {
        response = { ...response, ...RESPONSE_CORS_INTEGRATION };
    }

    return response;
}
