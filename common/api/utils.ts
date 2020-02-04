import apigateway = require('@aws-cdk/aws-apigateway');

export function getModelReference(modelId: string, restApiId: string) {
    return `https://apigateway.amazonaws.com/restapis/${restApiId}/models/${modelId}`;
}

export function addDefaultValidator(publicApi: apigateway.RestApi): any {
    return publicApi.addRequestValidator('DefaultValidator', {
        validateRequestParameters: true,
        validateRequestBody: true
    });
}

export function addServiceModel(name:string, publicApi: apigateway.RestApi, schema:any): any {
    return publicApi.addModel(name, {
        contentType: 'application/json',
        modelName: name,
        schema: schema
    });
}

export function createArraySchema(model:any, publicApi: apigateway.RestApi): any {
    return {
        type: apigateway.JsonSchemaType.ARRAY,
        items: {
            ref: getModelReference(model.modelId, publicApi.restApiId)
        }
    };
}