import { JsonSchemaVersion, type JsonSchema, JsonSchemaType } from "aws-cdk-lib/aws-apigateway";

export const visitSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    description: "Visit",
    properties: {
        visit_id: {
            type: JsonSchemaType.STRING,
            description: "Id"
        },
        vessel_id: {
            type: JsonSchemaType.STRING,
            description: "Vessel Id"
        },
        vessel_name: {
            type: JsonSchemaType.STRING,
            description: "Vessel name"
        },
        port_locode: {
            type: JsonSchemaType.STRING,
            description: "Port LOCODE"
        },
        eta: {
            type: JsonSchemaType.STRING,
            format: "date-time",
            description: "Estimated time of arrival"
        },
        etd: {
            type: [JsonSchemaType.STRING, JsonSchemaType.NULL],
            format: "date-time",
            description: "Estimated time of departure"
        },
        ata: {
            type: [JsonSchemaType.STRING, JsonSchemaType.NULL],
            format: "date-time",
            description: "Actual time of arrival"
        },
        atd: {
            type: [JsonSchemaType.STRING, JsonSchemaType.NULL],
            format: "date-time",
            description: "Actual time of departure"
        },
        status: {
            type: JsonSchemaType.STRING,
            description: "Status"
        },
        update_time: {
            type: JsonSchemaType.STRING,
            format: "date-time",
            description: "When visit was updated"
        }
    }
}