import apigateway = require('@aws-cdk/aws-apigateway');

export function featureSchema(propertiesSchema: apigateway.JsonSchema) {
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
                oneOf: [{type: apigateway.JsonSchemaType.NULL}, propertiesSchema]
            },
            geometry: {
                oneOf: [{type: apigateway.JsonSchemaType.NULL}, {type: apigateway.JsonSchemaType.OBJECT}]
            }
        }
    };
}

export function geojsonSchema(propertiesSchema: apigateway.JsonSchema) {
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
                items: featureSchema(propertiesSchema)
            }
        }
    };
}