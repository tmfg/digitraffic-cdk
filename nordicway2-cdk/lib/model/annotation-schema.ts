import apigateway = require('@aws-cdk/aws-apigateway');

const annotationsProperties: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: 'NW2 Annotations GeoJson',
    required: ['id', 'type', 'createdAt', 'recordedAt'],
    properties: {
        id: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Annotation id'
        },
        type: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Annotation type'
        },
        createdAt: {
            type: apigateway.JsonSchemaType.STRING,
            format: "date-time",
            description: 'Annotation created date time'
        },
        recordedAt: {
            type: apigateway.JsonSchemaType.STRING,
            format: "date-time",
            description: 'Annotation recorded date time'
        },
        expiresAt: {
            type: apigateway.JsonSchemaType.STRING,
            format: "date-time",
            description: 'Annotation expires date time'
        }
    }
};

export default annotationsProperties;