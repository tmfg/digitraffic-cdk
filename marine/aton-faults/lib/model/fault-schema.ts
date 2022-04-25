import apigateway = require('aws-cdk-lib/aws-apigateway');

export const faultsSchema: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: 'ATON Faults GeoJson',
    properties: {
        id: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Id',
        },
        // eslint-disable-next-line camelcase
        entry_timestamp: {
            type: apigateway.JsonSchemaType.STRING,
            format: "date-time",
            description: 'Created at timestamp',
        },
        // eslint-disable-next-line camelcase
        fixed_timestamp: {
            type: apigateway.JsonSchemaType.STRING,
            format: "date-time",
            description: 'Fixed at timestamp',
        },
        type: {
            type: apigateway.JsonSchemaType.STRING,
            format: "string",
            description: 'Type',
        },
    },
};
