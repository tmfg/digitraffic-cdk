import type { JsonSchema } from "aws-cdk-lib/aws-apigateway";
import { JsonSchemaType, JsonSchemaVersion } from "aws-cdk-lib/aws-apigateway";
// Manually converted from json-schema

export const Sse: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT7,
  type: JsonSchemaType.OBJECT,
  title: "The SSE Report Root Schema",
  additionalProperties: false,
  required: ["SSE_Reports"],
  properties: {
    SSE_Reports: {
      type: JsonSchemaType.ARRAY,
      title: "The Sse_reports Schema",
      items: {
        type: JsonSchemaType.OBJECT,
        title: "The Items Schema",
        required: ["Site", "SSE_Fields"],
        properties: {
          Site: {
            type: JsonSchemaType.OBJECT,
            title: "The Site Schema",
            additionalProperties: true,
            required: ["SiteName", "SiteNumber", "SiteType"],
            properties: {
              SiteName: {
                type: JsonSchemaType.STRING,
                title: "The Sitename Schema",
                pattern: "^(.*)$",
              },
              SiteNumber: {
                type: JsonSchemaType.INTEGER,
                title: "The Sitenumber Schema",
              },
              SiteType: {
                type: JsonSchemaType.STRING,
                enum: ["FIXED", "FLOATING"],
                title: "The SiteType Schema",
              },
            },
          },
          SSE_Fields: {
            type: JsonSchemaType.OBJECT,
            title: "The Sse_fields Schema",
            additionalProperties: true,
            required: [
              "Last_Update",
              "SeaState",
              "Trend",
              "WindWaveDir",
              "Confidence",
            ],
            properties: {
              Last_Update: {
                type: JsonSchemaType.STRING,
                title: "The Last_update Schema",
                format: "date-time",
              },
              SeaState: {
                type: JsonSchemaType.STRING,
                enum: ["CALM", "LIGHT", "MODERATE", "BREEZE", "GALE", "STORM"],
                title: "The Seastate Schema",
              },
              Trend: {
                type: JsonSchemaType.STRING,
                enum: ["UNKNOWN", "NO_CHANGE", "ASCENDING", "DESCENDING"],
                title: "The Trend Schema",
              },
              WindWaveDir: {
                type: JsonSchemaType.INTEGER,
                title: "The Windwavedir Schema",
                multipleOf: 1,
                minimum: 0,
                maximum: 359,
              },
              Confidence: {
                type: JsonSchemaType.STRING,
                enum: ["POOR", "MODERATE", "GOOD"],
                title: "The Confidence Schema",
              },
            },
          },
          Extra_Fields: {
            type: JsonSchemaType.OBJECT,
            title: "The Extra_fields Schema",
            additionalProperties: true,
            properties: {
              Temperature: {
                type: JsonSchemaType.INTEGER,
                title: "The Temperature Schema",
              },
              Heel_Angle: {
                type: JsonSchemaType.NUMBER,
                title: "The Heel_angle Schema",
                default: 0.0,
              },
              Light_Status: {
                type: JsonSchemaType.STRING,
                enum: ["ON", "OFF", "ON_D"],
                title: "The Light_status Schema",
              },
              Coord_Latitude: {
                type: JsonSchemaType.NUMBER,
                title: "The Coord_latitude Schema",
              },
              Coord_Longitude: {
                type: JsonSchemaType.NUMBER,
                title: "The Coord_longitude Schema",
              },
            },
          },
        },
      },
    },
  },
};
