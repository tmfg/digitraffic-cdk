import apigateway = require('aws-cdk-lib/aws-apigateway');

const schema: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: 'Open311 service model from https://github.com/open311/schema-validation',
    properties: {
        // eslint-disable-next-line camelcase
        service_code: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'unique identifier for the service request type',
        },
        // eslint-disable-next-line camelcase
        service_name: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'human readable name of the service request type',
        },
        description: {
            anyOf: [
                {
                    type: apigateway.JsonSchemaType.STRING,
                },
                {
                    type: apigateway.JsonSchemaType.NULL,
                },
            ],
        },
        metadata: {
            type: apigateway.JsonSchemaType.BOOLEAN,
            description: 'Are there additional form fields for this service type?',
        },
        type: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Possible values realtime, batch, blackbox',
            enum: [
                'realtime',
                'batch',
                'blackbox',
            ],
        },
        keywords: {
            anyOf: [
                {
                    type: apigateway.JsonSchemaType.STRING,
                },
                {
                    type: apigateway.JsonSchemaType.NULL,
                },
            ],
            description: 'list of keywords or tags separated by comma',
        },
        group: {
            anyOf: [
                {
                    type: apigateway.JsonSchemaType.STRING,
                },
                {
                    type: apigateway.JsonSchemaType.NULL,
                },
            ],
            description: 'Category or group to cluster different request types e.g. sanitation',
        },
    },
};

export default schema;