import apigateway = require('@aws-cdk/aws-apigateway');

export function featureSchema(modelReference: string) {
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
                ref: modelReference
            },
            geometry: {
                type: apigateway.JsonSchemaType.OBJECT,
                description: 'GeoJSON geometry'
            }
        }
    };
}

export function geojsonSchema(modelReference: string) {
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
                    ref: modelReference
                }
            }
        }
    };
}