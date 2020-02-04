import apigateway = require('@aws-cdk/aws-apigateway');

const annotationsProperties: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: 'NW2 Annotations GeoJson',
    required: ['id', 'type', 'createdAt', 'recordedAt'],
    properties: {
        id: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'FeatureCollection',
            enum: ['FeatureCollection']
        },
        type: {
            type: apigateway.JsonSchemaType.STRING,
        },
        createdAt: {
            type: apigateway.JsonSchemaType.STRING,
        },
        recordedAt: {
            type: apigateway.JsonSchemaType.STRING,
        },
        expiresAt: {
            type: apigateway.JsonSchemaType.STRING,
        }
    }
};

export default annotationsProperties;