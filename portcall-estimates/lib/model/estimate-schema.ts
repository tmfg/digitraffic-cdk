import apigateway = require('@aws-cdk/aws-apigateway');

const estimatesProperties: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: 'Portcall estimates schema',
    properties: {

    }
};

export default estimatesProperties;
