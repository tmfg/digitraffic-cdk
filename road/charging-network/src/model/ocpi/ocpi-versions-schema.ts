import * as apigateway from "aws-cdk-lib/aws-apigateway";

export const OcpiVersionSchema: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.OBJECT,
    description: "OCPI version JSON",
    properties: {
        version: {
            type: apigateway.JsonSchemaType.STRING,
            description: "OCPI version"
        },
        url: {
            type: apigateway.JsonSchemaType.STRING,
            description: "OCPI version url"
        }
    },
    required: ["version", "url"]
};

export const OcpiVersionsSchema: apigateway.JsonSchema = {
    schema: apigateway.JsonSchemaVersion.DRAFT4,
    type: apigateway.JsonSchemaType.ARRAY,
    description: "OCPI versions JSON",
    items: [OcpiVersionSchema]
};
