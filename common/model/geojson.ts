import apigateway = require('@aws-cdk/aws-apigateway');
import {getModelReference} from "../api/utils";

export function featureSchema(propertiesModel: any, publicApi: apigateway.RestApi) {
    return {
        schema: apigateway.JsonSchemaVersion.DRAFT4,
        type: apigateway.JsonSchemaType.OBJECT,
        description: 'GeoJson Feature',
        required: ['type', 'properties', 'geometry'],
        properties: {
            type: {
                type: apigateway.JsonSchemaType.STRING,
                description: 'Feature',
                enum: ['Feature']
            },
            properties: {
                ref: getModelReference(propertiesModel.modelId, publicApi.restApiId)
            },
            geometry: {
                type: apigateway.JsonSchemaType.OBJECT
            }
        }
    };
}

export function geojsonSchema(propertiesModel: any, publicApi: apigateway.RestApi) {
    return {
        schema: apigateway.JsonSchemaVersion.DRAFT4,
        type: apigateway.JsonSchemaType.OBJECT,
        description: 'GeoJson FeatureCollection',
        required: ['type', 'features'],
        properties: {
            type: {
                type: apigateway.JsonSchemaType.STRING,
                description: 'FeatureCollection',
                enum: ['FeatureCollection']
            },
            features: {
                type: apigateway.JsonSchemaType.ARRAY,
                items: {
                    ref: getModelReference(propertiesModel.modelId, publicApi.restApiId)
                }
            }
        }
    };
}