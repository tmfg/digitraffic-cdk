import apigateway = require('@aws-cdk/aws-apigateway');

const schema: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: 'NW2 Annotation',
    required: ['type'],
    properties: {
        type: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Unique ID of the service request created.',
            enum: ['FeatureCollection']
        }
//        features: {
//            type: apigateway.JsonSchemaType.ARRAY,
//            items: apigateway.JsonSchemaType.STRING
//        }
    }
};

export default schema;