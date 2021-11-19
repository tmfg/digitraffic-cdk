import {AUTHORIZATION_FAILED_MESSAGE, BAD_REQUEST_MESSAGE, ERROR_MESSAGE, NOT_FOUND_MESSAGE} from "./errors";
import {
    InternalServerErrorResponseTemplate,
    createResponses,
    XmlResponseTemplate, NotFoundResponseTemplate, SvgResponseTemplate, BadRequestResponseTemplate
} from "./response";
import {LambdaIntegration, MethodResponse, IntegrationResponse, PassthroughBehavior} from "@aws-cdk/aws-apigateway";
import {Function} from '@aws-cdk/aws-lambda';
import {MediaType} from './mediatypes';
import {IModel} from "@aws-cdk/aws-apigateway/lib/model";

/**
 * This is velocity-script, that assumes the response to be LambdaResponse(status and body).
 * It will always return the body and status, but if status in something else than 200 OK the content-type
 * will be overridden to text/plain. (it's assumed, that lambda will return error text)
 */
export const RESPONSE_DEFAULT_LAMBDA = `#set($inputRoot = $input.path('$'))
$inputRoot.body
#if ($inputRoot.status != 200)
#set ($context.responseOverride.status = $inputRoot.status)
#set ($context.responseOverride.header.Content-Type = 'text/plain')
#end
#set ($context.responseOverride.header.Access-Control-Allow-Origin = '*')
`;

export const RESPONSE_401_UNAUTHORIZED: IntegrationResponse = {
    statusCode: '401',
    selectionPattern: AUTHORIZATION_FAILED_MESSAGE
}

export const RESPONSE_200_OK: IntegrationResponse = {
    statusCode: '200'
};

export const RESPONSE_400_BAD_REQUEST: IntegrationResponse = {
    statusCode: '400',
    selectionPattern: BAD_REQUEST_MESSAGE,
    responseTemplates: BadRequestResponseTemplate
}

export const RESPONSE_500_SERVER_ERROR: IntegrationResponse = {
    statusCode: '500',
    selectionPattern: ERROR_MESSAGE,
    responseTemplates: InternalServerErrorResponseTemplate
};

const RESPONSE_XML = {
    responseTemplates: XmlResponseTemplate
};

export const RESPONSE_SVG = {
    responseTemplates: SvgResponseTemplate
}

export const RESPONSE_CORS_INTEGRATION = {
    responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': "'*'"
    }
};

export const RESPONSE_404_NOT_FOUND = {
    statusCode: '404',
    selectionPattern: NOT_FOUND_MESSAGE,
    responseTemplates: NotFoundResponseTemplate
};

export const TEMPLATE_COGNITO_GROUPS = {
    'application/json': JSON.stringify({
        "groups": "$context.authorizer.claims['cognito:groups']",
        "username": "$context.authorizer.claims['cognito:username']"
    })};

export function methodResponse(status: string, contentType: MediaType, model: IModel, parameters?: Record<string, boolean>): MethodResponse {
    return  {
        statusCode: status,
        responseModels: createResponses(contentType, model),
        responseParameters: parameters || {}
    };

}

export function corsMethod(response: MethodResponse): MethodResponse {
    return {...response, ...{
        responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true
        }
    }};
}

interface IntegrationOptions {
    requestParameters?: {[dest: string]: string}
    requestTemplates?: {[contentType: string]: string},
    responses?: IntegrationResponse[],
    disableCors?: boolean,
    xml?: boolean,
    passthroughBehavior?: PassthroughBehavior
}

/**
 * Creates a default Lambda integration for a REST API resource _root_
 * @param lambdaFunction The Lambda function
 * @param options Options
 */
export function defaultIntegration(
    lambdaFunction: Function,
    options?: IntegrationOptions,
): LambdaIntegration {
    return new LambdaIntegration(lambdaFunction, {
        proxy: false,
        integrationResponses: options?.responses || [
            getResponse(RESPONSE_200_OK, options),
            getResponse(RESPONSE_400_BAD_REQUEST, options),
            getResponse(RESPONSE_401_UNAUTHORIZED, options),
            getResponse(RESPONSE_404_NOT_FOUND, options),
            getResponse(RESPONSE_500_SERVER_ERROR, options),
        ],
        requestParameters: options?.requestParameters || {},
        requestTemplates: options?.requestTemplates || {},
        passthroughBehavior: options?.passthroughBehavior ?? PassthroughBehavior.WHEN_NO_MATCH
    });
}

export function getResponse(response: IntegrationResponse, options?: IntegrationOptions): IntegrationResponse {
    if(options?.xml) {
        response = {...response, ...RESPONSE_XML};
    }
    if(!options?.disableCors) {
        response = {...response, ...RESPONSE_CORS_INTEGRATION};
    }

    return response;
}
