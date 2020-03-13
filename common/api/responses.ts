import {NOT_FOUND_MESSAGE} from "./errors";
import {
    APPLICATION_JSON,
    InternalServerErrorResponseTemplate,
    createResponses,
    XmlResponseTemplate, APPLICATION_XML, NotFoundResponseTemplate
} from "./response";
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

export function defaultIntegration(lambdaFunction: Function, requestParameters: any = {}, requestTemplates: any = {}): LambdaIntegration {
    return new LambdaIntegration(lambdaFunction, {
        proxy: false,
        integrationResponses: [
            RESPONSE_200_OK,
            RESPONSE_500_SERVER_ERROR
        ],
        requestParameters: requestParameters,
        requestTemplates: requestTemplates
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