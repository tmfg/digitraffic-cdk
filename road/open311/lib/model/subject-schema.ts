import apigateway = require('@aws-cdk/aws-apigateway');

const schema: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: 'Extended subject model for Open311 service requests',
    properties: {
        active: {
            type: apigateway.JsonSchemaType.NUMBER,
            description: 'Is the subject active: 1 if active, 0 if not active'
        },
        name: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Subject name'
        },
        id: {
            type: apigateway.JsonSchemaType.NUMBER,
            description: 'Unique identifier for the subject'
        },
        locale: {
            type: apigateway.JsonSchemaType.STRING,
            description: "Locale, e.g. 'en'"
        }
    }
};

export default schema;
