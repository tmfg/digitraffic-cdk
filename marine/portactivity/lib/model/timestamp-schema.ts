import { JsonSchema, JsonSchemaType, JsonSchemaVersion } from "aws-cdk-lib/aws-apigateway";
import { EventType } from "./timestamp";

export const ShipSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    description: "PortActivity timestamps ship schema",
    properties: {
        mmsi: {
            type: [JsonSchemaType.NUMBER, JsonSchemaType.STRING, JsonSchemaType.NULL],
            description: "MMSI"
        },
        imo: {
            type: [JsonSchemaType.NUMBER, JsonSchemaType.STRING, JsonSchemaType.NULL],
            description: "IMO"
        }
    }
};

export const LocationSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    description: "PortActivity timestamps location schema",
    required: ["port"],
    properties: {
        port: {
            type: JsonSchemaType.STRING,
            description: "Port LOCODE"
        },
        portArea: {
            type: [JsonSchemaType.STRING, JsonSchemaType.NULL],
            description: "Port area LOCODE"
        },
        from: {
            type: [JsonSchemaType.STRING, JsonSchemaType.NULL],
            description: "Previous port area LOCODE"
        }
    }
};

export function createTimestampSchema(shipReference: string, locationReference: string): JsonSchema {
    return {
        schema: JsonSchemaVersion.DRAFT4,
        type: JsonSchemaType.OBJECT,
        description: "PortActivity timestamps schema",
        required: ["eventType", "eventTime", "recordTime", "source", "ship", "location"],
        properties: {
            eventType: {
                type: JsonSchemaType.STRING,
                enum: Object.keys(EventType),
                description: `Event type: ${Object.keys(EventType).toString()}`
            },
            eventTime: {
                type: JsonSchemaType.STRING,
                description: "Event time in ISO 8601 date format"
            },
            eventTimeConfidenceLowerDiff: {
                type: [JsonSchemaType.NUMBER],
                description: "Event time confidence, lower bound in seconds."
            },
            eventTimeConfidenceUpperDiff: {
                type: [JsonSchemaType.NUMBER],
                description: "Event time confidence, upper bound in seconds."
            },
            recordTime: {
                type: JsonSchemaType.STRING,
                description: "Timestamp of event creation in ISO 8601 date format"
            },
            source: {
                type: JsonSchemaType.STRING,
                description: "Event source"
            },
            ship: {
                ref: shipReference
            },
            location: {
                ref: locationReference
            },
            portcallId: {
                type: [JsonSchemaType.NUMBER, JsonSchemaType.NULL],
                description: "ID of Portnet port call"
            }
        }
    };
}
