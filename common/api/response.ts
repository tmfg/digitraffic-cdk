import apigateway = require('@aws-cdk/aws-apigateway');

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
    contentType: 'application/json',
    modelName: 'MessageResponseModel',
    schema: messageSchema
};

const NotFoundMessage = 'Not found';
const NotFoundResponse = JSON.stringify({message: NotFoundMessage});

export const NotFoundResponseTemplate = {
    'application/json': NotFoundResponse
};

const InternalServerErrorMessage = 'Error';
const InternalServerErrorResponse = JSON.stringify({message: InternalServerErrorMessage});

export const InternalServerErrorResponseTemplate = {
    'application/json': InternalServerErrorResponse
};

const BadRequestMessage = 'Bad request';
const BadRequestResponse = JSON.stringify({message: BadRequestMessage});

export const BadRequestResponseTemplate = {
    'application/json': BadRequestResponse
};

export const XmlResponseTemplate = {
    'application/xml': "$input.path('$').body"
}