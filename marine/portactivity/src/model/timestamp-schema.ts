import {
  type JsonSchema,
  JsonSchemaType,
  JsonSchemaVersion,
} from "aws-cdk-lib/aws-apigateway";
import { EventType } from "./timestamp.js";

export const ShipSchema: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  type: JsonSchemaType.OBJECT,
  description: "PortActivity timestamps ship schema",
  required: ["imo"],
  properties: {
    mmsi: {
      type: [JsonSchemaType.NUMBER, JsonSchemaType.NULL],
      description: "MMSI",
    },
    imo: {
      type: [JsonSchemaType.NUMBER],
      description: "IMO",
    },
  },
};

export const LocationSchema: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  type: JsonSchemaType.OBJECT,
  description: "PortActivity timestamps location schema",
  required: ["port"],
  properties: {
    port: {
      type: JsonSchemaType.STRING,
      description: "Port LOCODE",
    },
    portArea: {
      type: [JsonSchemaType.STRING, JsonSchemaType.NULL],
      description: "Port area LOCODE",
    },
    from: {
      type: [JsonSchemaType.STRING, JsonSchemaType.NULL],
      description: "Previous port area LOCODE",
    },
  },
};

export function createTimestampSchema(
  shipReference: string,
  locationReference: string,
): JsonSchema {
  return {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    description: "PortActivity timestamps schema",
    required: [
      "eventType",
      "eventTime",
      "recordTime",
      "source",
      "ship",
      "location",
    ],
    properties: {
      eventType: {
        type: JsonSchemaType.STRING,
        enum: Object.keys(EventType),
        description: `Event type: ${Object.keys(EventType).toString()}`,
      },
      eventTime: {
        type: JsonSchemaType.STRING,
        description: "Event time in ISO 8601 date format",
      },
      eventTimeConfidenceLowerDiff: {
        type: [JsonSchemaType.NUMBER, JsonSchemaType.NULL],
        description:
          "Event time 80% confidence interval, lower bound in seconds as difference from eventTime.",
      },
      eventTimeConfidenceUpperDiff: {
        type: [JsonSchemaType.NUMBER, JsonSchemaType.NULL],
        description:
          "Event time 80% confidence interval, upper bound in seconds as difference from eventTime.",
      },
      recordTime: {
        type: JsonSchemaType.STRING,
        description: "Timestamp of event creation in ISO 8601 date format",
      },
      source: {
        type: JsonSchemaType.STRING,
        description: "Event source",
      },
      sourceId: {
        type: [JsonSchemaType.STRING, JsonSchemaType.NULL],
        description: "ID in source system",
      },
      ship: {
        ref: shipReference,
      },
      location: {
        ref: locationReference,
      },
      portcallId: {
        type: [JsonSchemaType.NUMBER, JsonSchemaType.NULL],
        description: "ID of Portnet port call",
      },
    },
  };
}
