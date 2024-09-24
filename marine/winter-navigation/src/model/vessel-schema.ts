import { JsonSchemaVersion, type JsonSchema, JsonSchemaType } from "aws-cdk-lib/aws-apigateway";

export const vesselSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    description: "Winter Navigation Vessel",
    properties: {
        name: {
            type: JsonSchemaType.STRING,
            description: "Name"
        },
        locodeList: {
            type: JsonSchemaType.STRING,
            description: "Callsign"
        },
        nationality: {
            type: JsonSchemaType.STRING,
            description: "Shortcode"
        },
        latitude: {
            type: JsonSchemaType.NUMBER,
            description: "IMO"
        },
        longitude: {
            type: JsonSchemaType.NUMBER,
            description: "MMSI"
        },
        winterport: {
            type: JsonSchemaType.STRING,
            description: "Type"
        }
    }
};
