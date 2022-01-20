import apigateway = require('aws-cdk-lib/aws-apigateway');
import {MediaType} from "../../types/mediatypes";

/**
 * This is velocity-script, that assumes the response to be LambdaResponse(status and body).
 * It will always return the body and status, but if status in something else than 200 OK the content-type
 * will be overridden to text/plain. (it's assumed, that lambda will return error text).
 *
 * If fileName is set, then Content-Disposition-header will be set to use it
 */
export const RESPONSE_DEFAULT_LAMBDA = `#set($inputRoot = $input.path('$'))
$inputRoot.body
#if ($inputRoot.status != 200)
#set ($context.responseOverride.status = $inputRoot.status)
#set ($context.responseOverride.header.Content-Type = 'text/plain')
#end
#set ($context.responseOverride.header.Access-Control-Allow-Origin = '*')
#if ("$!inputRoot.fileName" != "")
#set ($disposition = 'attachment; filename="FN"')
#set ($context.responseOverride.header.Content-Disposition = $disposition.replaceAll('FN', $inputRoot.fileName))
#end
`;

const BODY_FROM_INPUT_PATH = "$input.path('$').body";

// DEPRECATED
const messageSchema: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: 'Response with message',
    properties: {
        message: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Response message',
        },
    },
};

// DEPRECATED
export const MessageModel = {
    contentType: MediaType.APPLICATION_JSON,
    modelName: 'MessageResponseModel',
    schema: messageSchema,
};

const NotFoundMessage = 'Not found';
export const NotFoundResponse = JSON.stringify({message: NotFoundMessage});

const InternalServerErrorMessage = 'Error';
const InternalServerErrorResponse = JSON.stringify({message: InternalServerErrorMessage});

const BadRequestMessage = 'Bad request';
const BadRequestResponse = JSON.stringify({message: BadRequestMessage});

export const BadRequestResponseTemplate = createResponses(MediaType.APPLICATION_JSON, BadRequestResponse);
export const NotFoundResponseTemplate = createResponses(MediaType.APPLICATION_JSON, NotFoundResponse);
export const XmlResponseTemplate = createResponses(MediaType.APPLICATION_XML, BODY_FROM_INPUT_PATH);
export const SvgResponseTemplate = createResponses(MediaType.IMAGE_SVG, BODY_FROM_INPUT_PATH);
export const InternalServerErrorResponseTemplate = createResponses(MediaType.APPLICATION_JSON, InternalServerErrorResponse);

export function createResponses<T>(key: MediaType, value: T): Record<string, T> {
    const map: Record<string, T> = {};

    map[key] = value;

    return map;
}
