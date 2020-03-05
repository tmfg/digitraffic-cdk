import apigateway = require('@aws-cdk/aws-apigateway');

export const APPLICATION_JSON = 'application/json';
export const APPLICATION_XML = 'application/xml';

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
    contentType: APPLICATION_JSON,
    modelName: 'MessageResponseModel',
    schema: messageSchema
};

const NotFoundMessage = 'Not found';
export const NotFoundResponse = JSON.stringify({message: NotFoundMessage});

const InternalServerErrorMessage = 'Error';
const InternalServerErrorResponse = JSON.stringify({message: InternalServerErrorMessage});

const BadRequestMessage = 'Bad request';
const BadRequestResponse = JSON.stringify({message: BadRequestMessage});

export const BadRequestResponseTemplate = createResponses(APPLICATION_JSON, BadRequestResponse);
export const NotFoundResponseTemplate = createResponses(APPLICATION_JSON, NotFoundResponse);
export const XmlResponseTemplate = createResponses(APPLICATION_XML, "$input.path('$').body");
export const InternalServerErrorResponseTemplate = createResponses(APPLICATION_JSON, InternalServerErrorResponse);

export function createResponses(key: string, value: any) {
    let map: {[key: string]: any} = {};

    map[key] = value;

    return map;
}