import {
  type JsonSchema,
  JsonSchemaType,
  JsonSchemaVersion,
} from "aws-cdk-lib/aws-apigateway";
import { AllGranularities } from "./types.js";

export const siteSchema: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  type: JsonSchemaType.OBJECT,
  description: "Counting Site Metadata",
  properties: {
    id: {
      type: JsonSchemaType.INTEGER,
      description: "Site id",
    },
    name: {
      type: JsonSchemaType.STRING,
      description: "Site name",
    },
    domain: {
      type: JsonSchemaType.STRING,
      description: "Site domain",
    },
    description: {
      type: JsonSchemaType.STRING,
      description: "Site description",
    },
    customId: {
      type: JsonSchemaType.STRING,
      description: "Custom id for site",
    },
    granularity: {
      type: JsonSchemaType.STRING,
      enum: [...AllGranularities],
      description: "Time interval between two consecutive data",
    },
    directional: {
      type: JsonSchemaType.BOOLEAN,
      description: "Indicator telling if directions are distinguished",
    },
    travelModes: {
      type: JsonSchemaType.STRING,
      format: "date-time",
      description: "Removal timestamp",
    },
    dataUpdatedTime: {
      type: JsonSchemaType.STRING,
      format: "date-time",
      description: "Data updated timestamp",
    },
    lastDataTimestamp: {
      type: JsonSchemaType.STRING,
      format: "date-time",
      description: "Data updated timestamp",
    },
  },
};

export const travelModesSchema: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  type: JsonSchemaType.ARRAY,
  description: "Counting Site Travel Modes",
  items: {
    type: JsonSchemaType.STRING,
    description: "Travel mode",
  },
};

export const directionsSchema: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  type: JsonSchemaType.ARRAY,
  description: "Counting Site Directions",
  items: {
    type: JsonSchemaType.STRING,
    description: "Direction",
  },
};

export const domainsSchema: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  type: JsonSchemaType.ARRAY,
  description: "Counting Site Domains",
  items: {
    type: JsonSchemaType.STRING,
    description: "Domain",
  },
};

export const valueSchema: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  type: JsonSchemaType.ARRAY,
  description: "Counting Site data",
  items: {
    type: JsonSchemaType.OBJECT,
    properties: {
      dataTimestamp: {
        type: JsonSchemaType.STRING,
        format: "date-time",
        description: "Data interval start",
      },
      interval: {
        type: JsonSchemaType.NUMBER,
        description: "Interval length in minutes",
      },
      count: {
        type: JsonSchemaType.NUMBER,
        description: "Counter count",
      },
      status: {
        type: JsonSchemaType.NUMBER,
        description: "Counter status",
      },
    },
  },
};
