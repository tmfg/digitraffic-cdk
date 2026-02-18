import type { JsonSchema } from "aws-cdk-lib/aws-apigateway";
import { JsonSchemaType, JsonSchemaVersion } from "aws-cdk-lib/aws-apigateway";

export const faultsSchema: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  type: JsonSchemaType.OBJECT,
  description: "ATON Faults GeoJson",
  properties: {
    id: {
      type: JsonSchemaType.STRING,
      description: "Id",
    },
    entry_timestamp: {
      type: JsonSchemaType.STRING,
      format: "date-time",
      description: "Created at timestamp",
    },
    fixed_timestamp: {
      type: JsonSchemaType.STRING,
      format: "date-time",
      description: "Fixed at timestamp",
    },
    type: {
      type: JsonSchemaType.STRING,
      format: "string",
      description: "Type",
    },
  },
};
