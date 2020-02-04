import {NOT_FOUND_MESSAGE} from "./errors";
import {InternalServerErrorResponseTemplate, NotFoundResponseTemplate} from "./response";

export const RESPONSE_200_OK = {
    statusCode: '200'
};

export const RESPONSE_404_NOT_FOUND = {
    statusCode: '404',
    selectionPattern: NOT_FOUND_MESSAGE,
    responseTemplates: NotFoundResponseTemplate
};

export const RESPONSE_500_SERVER_ERROR = {
    statusCode: '500',
    selectionPattern: '(\n|.)+',
    responseTemplates: InternalServerErrorResponseTemplate
};

export function methodResponse(status: string, model: any) {
    return             {
        statusCode: status,
        responseModels: {
            'application/json': model
        }
    };
}

