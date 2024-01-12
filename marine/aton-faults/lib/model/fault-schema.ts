import apigateway from "aws-cdk-lib/aws-apigateway";

export const faultsSchema: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: "ATON Faults GeoJson",
    properties: {
        id: {
            type: apigateway.JsonSchemaType.STRING,
            description: "Id",
        },
        entry_timestamp: {
            type: apigateway.JsonSchemaType.STRING,
            format: "date-time",
            description: "Created at timestamp",
        },
        fixed_timestamp: {
            type: apigateway.JsonSchemaType.STRING,
            format: "date-time",
            description: "Fixed at timestamp",
        },
        type: {
            type: apigateway.JsonSchemaType.STRING,
            format: "string",
            description: "Type",
        },
    },
};
