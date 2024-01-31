import { type JsonSchema, JsonSchemaType, JsonSchemaVersion } from "aws-cdk-lib/aws-apigateway";

export const OkResponse: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT7,
    type: JsonSchemaType.OBJECT,
    title: "OK Response Schema",
    additionalProperties: false,
    required: [
        "count",
    ],
    properties: {
        count: {
            type: JsonSchemaType.NUMBER,
            title: "Count of saved reports",
        },
    },
};