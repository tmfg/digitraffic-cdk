import {NOT_FOUND_MESSAGE} from "./errors";
import {
    APPLICATION_JSON,
    InternalServerErrorResponseTemplate,
    createResponses,
    XmlResponseTemplate, APPLICATION_XML, NotFoundResponseTemplate
} from "./response";
import {LambdaIntegration, MethodResponse} from "@aws-cdk/aws-apigateway";
import {Function} from '@aws-cdk/aws-lambda';

const RESPONSE_CORS_INTEGRATION = {
    responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': "'*'"
    }
};

export const RESPONSE_200_OK = {
    statusCode: '200'
};

const RESPONSE_XML = {
    responseTemplates: XmlResponseTemplate
};

export const RESPONSE_200_OK_CORS = {...RESPONSE_200_OK, ...RESPONSE_CORS_INTEGRATION};

export const RESPONSE_200_OK_XML = {...RESPONSE_200_OK, ...RESPONSE_XML};

export const RESPONSE_200_OK_XML_CORS = {...RESPONSE_200_OK_XML, ...RESPONSE_CORS_INTEGRATION};

export const RESPONSE_404_NOT_FOUND = {
    statusCode: '404',
    selectionPattern: NOT_FOUND_MESSAGE,
    responseTemplates: NotFoundResponseTemplate
};

const RESPONSE_404_NOT_FOUND_CORS = {...RESPONSE_404_NOT_FOUND, ...RESPONSE_CORS_INTEGRATION};

export const RESPONSE_500_SERVER_ERROR = {
    statusCode: '500',
    selectionPattern: '(\n|.)+',
    responseTemplates: InternalServerErrorResponseTemplate
};

export const RESPONSE_500_SERVER_ERROR_CORS = {...RESPONSE_500_SERVER_ERROR, ...RESPONSE_CORS_INTEGRATION};

export function methodJsonResponse(status: string, model: any) {
    return  {
        statusCode: status,
        responseModels: createResponses(APPLICATION_JSON, model)
    };
}

export function methodXmlResponse(status: string, model: any) {
    return  {
        statusCode: status,
        responseModels: createResponses(APPLICATION_XML, model)
    };
}

export function corsHeaders(methodResponse: MethodResponse): MethodResponse {
    return Object.assign({}, methodResponse, {
        responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true
        }
    });
}

export function corsMethodJsonResponse(status: string, model: any): MethodResponse {
    return corsHeaders(methodJsonResponse(status, model));
}

export function corsMethodXmlResponse(status: string, model: any) {
    return corsHeaders(methodXmlResponse(status, model));
}

interface IntegrationOptions {
    requestParameters?: {[dest: string]: string}
    requestTemplates?: {[contentType: string]: string},
    disableCors?: boolean,
    xml?: boolean
}

export function defaultIntegration(
    lambdaFunction: Function,
    options?: IntegrationOptions
): LambdaIntegration {
    return new LambdaIntegration(lambdaFunction, {
        proxy: false,
        integrationResponses: [
            get200Response(options),
            get500Response(options)
        ],
        requestParameters: options?.requestParameters || {},
        requestTemplates: options?.requestTemplates || {}
    });
}

export function defaultSingleResourceIntegration(
    lambdaFunction: Function,
    options?: IntegrationOptions
): LambdaIntegration {
    return new LambdaIntegration(lambdaFunction, {
        proxy: false,
        integrationResponses: [
            options?.disableCors ? RESPONSE_200_OK : RESPONSE_200_OK_CORS,
            options?.disableCors ? RESPONSE_404_NOT_FOUND: RESPONSE_404_NOT_FOUND_CORS,
            options?.disableCors ? RESPONSE_500_SERVER_ERROR : RESPONSE_500_SERVER_ERROR_CORS,
        ],
        requestParameters: options?.requestParameters || {},
        requestTemplates: options?.requestTemplates || {}
    });
}

function get200Response(options?: IntegrationOptions) {
    if(options?.xml) {
        return options?.disableCors ? RESPONSE_200_OK_XML : RESPONSE_200_OK_XML_CORS;
    }

    return options?.disableCors ? RESPONSE_200_OK : RESPONSE_200_OK_CORS;
}

function get500Response(options?: IntegrationOptions) {
    return options?.disableCors ? RESPONSE_500_SERVER_ERROR : RESPONSE_500_SERVER_ERROR_CORS;
}