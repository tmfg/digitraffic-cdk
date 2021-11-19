import apigateway = require('@aws-cdk/aws-apigateway');
import {MediaType} from "./mediatypes";

export const INPUT_RAW = "$input.path('$')";
export const BODY_FROM_INPUT_PATH = "$input.path('$').body";

const messageSchema: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: 'Response with message',
    properties: {
        message: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Response message'
        }
    }
};

export const MessageModel = {
    contentType: MediaType.APPLICATION_JSON,
    modelName: 'MessageResponseModel',
    schema: messageSchema
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
