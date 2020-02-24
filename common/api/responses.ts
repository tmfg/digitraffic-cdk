import {NOT_FOUND_MESSAGE} from "./errors";
import {InternalServerErrorResponseTemplate, NotFoundResponseTemplate, XmlResponseTemplate} from "./response";
import {LambdaIntegration} from "@aws-cdk/aws-apigateway";
import {Function} from '@aws-cdk/aws-lambda';

export const RESPONSE_200_OK = {
    statusCode: '200'
};

export const RESPONSE_200_OK_XML = {
    statusCode: '200',
    responseTemplates: XmlResponseTemplate
}

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
    return  {
        statusCode: status,
        responseModels: {
            'application/json': model
        }
    };
}

export function defaultIntegration(lambdaFunction: Function): LambdaIntegration {
    return new LambdaIntegration(lambdaFunction, {
        proxy: false,
        integrationResponses: [
            RESPONSE_200_OK,
            RESPONSE_500_SERVER_ERROR
        ]
    });
}

export function defaultXmlIntegration(lambdaFunction: Function): LambdaIntegration {
    return new LambdaIntegration(lambdaFunction, {
        proxy: false,
        integrationResponses: [
            RESPONSE_200_OK_XML,
            RESPONSE_500_SERVER_ERROR
        ]
    });
}