import apigateway = require('@aws-cdk/aws-apigateway');

const annotationsProperties: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: 'NW2 Annotations GeoJson',
    properties: {
        id: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Id'
        },
        type: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'type'
        },
        createdAt: {
            type: apigateway.JsonSchemaType.STRING,
            format: "date-time",
            description: 'Created date time'
        },
        recordedAt: {
            type: apigateway.JsonSchemaType.STRING,
            format: "date-time",
            description: 'Recorded date time'
        },
        expiresAt: {
            type: apigateway.JsonSchemaType.STRING,
            format: "date-time",
            description: 'Expires date time'
        }
    }
};

export default annotationsProperties;