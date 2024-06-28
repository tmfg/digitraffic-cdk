import {
    RestApi,
    Model,
    type JsonSchema,
    RequestValidator,
    JsonSchemaType,
    JsonSchemaVersion,
} from 'aws-cdk-lib/aws-apigateway';
import type {ModelWithReference} from "../aws/types/model-with-reference.mjs";

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
export function addDefaultValidator(api: RestApi): RequestValidator {
    return api.addRequestValidator('DefaultValidator', {
        validateRequestParameters: true,
        validateRequestBody: true,
    });
}

/**
 * Adds a JSON Schema model to an API Gateway API. Can be used later to generate OpenAPI specifications.
 * This method adds a schema for _a single object._
 * @param name Name of the model
 * @param api REST API
 * @param schema JSON Schema
 * @return ModelWithReference A model object with a reference to an API Gateway model object.
 */
export function addServiceModel(modelName: string, api: RestApi, schema: JsonSchema): ModelWithReference {
    const mwr = api.addModel(modelName, {
        contentType: 'application/json',
        modelName,
        schema,
    }) as ModelWithReference;
    mwr.modelReference = getModelReference(mwr.modelId, api.restApiId);
    return mwr;
}

/**
 * Add an empty JSON schema model to an API Gateway API.
 * Usable for example if the incoming data is in XML format but some template transformation is necessary.
 * @param modelName
 * @param api
 * @param contentType
 */
export function addSimpleServiceModel(modelName: string, api: RestApi, contentType = 'application/xml'): Model {
    return api.addModel(modelName, {
        contentType,
        modelName,
        schema: {},
    });
}

/**
 * Adds a JSON Schema model to an API Gateway API. Can be used later to generate OpenAPI specifications.
 * This method adds a schema for _an array._
 * @param model
 * @param api
 */
export function createArraySchema(model: Model, api: RestApi): JsonSchema {
    return {
        type: JsonSchemaType.ARRAY,
        items: {
            ref: getModelReference(model.modelId, api.restApiId),
        },
    };
}

/**
 * Creates a JSON Schema for a GeoJSON Feature. Can be used to generate OpenAPI descriptions.
 * @param modelReference Reference to a model object
 */
export function featureSchema(modelReference: string) {
    return {
        schema: JsonSchemaVersion.DRAFT4,
        type: JsonSchemaType.OBJECT,
        description: 'GeoJson Feature',
        required: ['type', 'properties', 'geometry'],
        properties: {
            type: {
                type: JsonSchemaType.STRING,
                description: 'Feature',
                enum: ['Feature'],
            },
            properties: {
                ref: modelReference,
            },
            geometry: {
                type: JsonSchemaType.OBJECT,
                description: 'GeoJSON geometry',
            },
        },
    };
}

/**
 *
 * Creates a JSON Schema for a GeoJSON Feature Collection. Can be used to generate OpenAPI descriptions.
 * @param modelReference Reference to a model object, in this case Features.
 */
export function geojsonSchema(modelReference: string) {
    return {
        schema: JsonSchemaVersion.DRAFT4,
        type: JsonSchemaType.OBJECT,
        description: 'GeoJson FeatureCollection',
        required: ['type', 'features'],
        properties: {
            type: {
                type: JsonSchemaType.STRING,
                description: 'FeatureCollection',
                enum: ['FeatureCollection'],
            },
            features: {
                type: JsonSchemaType.ARRAY,
                items: {
                    ref: modelReference,
                },
            },
        },
    };
}
