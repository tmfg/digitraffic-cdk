import apigateway = require('@aws-cdk/aws-apigateway');
import {Model} from "@aws-cdk/aws-apigateway";

/**
 * Get a reference to an OpenAPI model object in a REST API.
 * Can be used to supply a reference to properties of a GeoJSON feature.
 * @param modelId Id of the referenced object
 * @param restApiId Id of the REST API
 */
export function getModelReference(modelId: string, restApiId: string) {
    return `https://apigateway.amazonaws.com/restapis/${restApiId}/models/${modelId}`;
}

/**
 * Adds a request validator to a REST API to enforce request parameters/body requirements.
 * https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-method-request-validation.html
 * @param api REST API
 */
export function addDefaultValidator(api: apigateway.RestApi): apigateway.RequestValidator {
    return api.addRequestValidator('DefaultValidator', {
        validateRequestParameters: true,
        validateRequestBody: true
    });
}

/**
 * Adds a JSON Schema model to an API Gateway API. Can be used later to generate OpenAPI specifications.
 * This method adds a schema for _a single object._
 * @param name Name of the model
 * @param api REST API
 * @param schema JSON Schema
 */
export function addServiceModel(name:string, api: apigateway.RestApi,
                                schema: apigateway.JsonSchema): Model {
    return api.addModel(name, {
        contentType: 'application/json',
        modelName: name,
        schema: schema
    });
}

export function addXmlserviceModel(name:string, api: apigateway.RestApi): any {
    return api.addModel(name, {
        contentType: 'application/xml',
        modelName: name,
        schema: {}
    });
}

/**
 * Adds a JSON Schema model to an API Gateway API. Can be used later to generate OpenAPI specifications.
 * This method adds a schema for _an array._
 * @param model
 * @param api
 */
export function createArraySchema(model: apigateway.Model, api: apigateway.RestApi): any {
    return {
        type: apigateway.JsonSchemaType.ARRAY,
        items: {
            ref: getModelReference(model.modelId, api.restApiId)
        }
    };
}