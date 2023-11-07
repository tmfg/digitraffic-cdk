import { JsonSchema, JsonSchemaType, JsonSchemaVersion } from "aws-cdk-lib/aws-apigateway";

export const LocodeMetadataSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.ARRAY,
    items: {
        type: JsonSchemaType.STRING,
        minLength: 5,
        maxLength: 5,
        pattern: "^[A-Z]{5}$",
        description: "Port LOCODE"
    }
};
