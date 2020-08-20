import {JsonSchemaVersion, JsonSchemaType} from '@aws-cdk/aws-apigateway';

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
                enum: ['Feature']
            },
            properties: {
                ref: modelReference
            },
            geometry: {
                type: JsonSchemaType.OBJECT,
                description: 'GeoJSON geometry'
            }
        }
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
                enum: ['FeatureCollection']
            },
            features: {
                type: JsonSchemaType.ARRAY,
                items: {
                    ref: modelReference
                }
            }
        }
    };
}