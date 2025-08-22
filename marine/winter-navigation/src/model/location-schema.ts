import {
  type JsonSchema,
  JsonSchemaType,
  JsonSchemaVersion,
} from "aws-cdk-lib/aws-apigateway";

export const locationSchema: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  type: JsonSchemaType.OBJECT,
  description: "Winter Navigation Location",
  properties: {
    id: {
      type: JsonSchemaType.STRING,
      description: "Id",
    },
    name: {
      type: JsonSchemaType.STRING,
      description: "Name",
    },
    locodeList: {
      type: JsonSchemaType.STRING,
      description: "List of locodes",
    },
    nationality: {
      type: JsonSchemaType.STRING,
      description: "Nationality",
    },
    latitude: {
      type: JsonSchemaType.NUMBER,
      description: "Latitude",
    },
    longitude: {
      type: JsonSchemaType.NUMBER,
      description: "Longitude",
    },
    winterport: {
      type: JsonSchemaType.BOOLEAN,
      description: "Is this a winterport",
    },
  },
};
