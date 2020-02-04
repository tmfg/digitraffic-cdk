import apigateway = require('@aws-cdk/aws-apigateway');

const featureSchema: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: 'NW2 Annotation Feature',
    required: ['type', 'properties', 'geometry'],
    properties: {
        type: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Feature',
            enum: ['Feature']
        },
        properties: {
            oneOf: [{type: apigateway.JsonSchemaType.NULL}, {type: apigateway.JsonSchemaType.OBJECT}]
        },
        geometry: {
            oneOf: [{type: apigateway.JsonSchemaType.NULL}, {type: apigateway.JsonSchemaType.OBJECT}]
        }
    }
}

const annotationsGeoJsonSchema: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: 'NW2 Annotations GeoJson',
    required: ['type', 'features'],
    properties: {
        type: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'FeatureCollection',
            enum: ['FeatureCollection']
        },
        features: {
            type: apigateway.JsonSchemaType.ARRAY,
            items: featureSchema
        }
    }
};

export default annotationsGeoJsonSchema;