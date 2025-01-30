import apigateway = require("aws-cdk-lib/aws-apigateway");

const schema: apigateway.JsonSchema = {
  schema: apigateway.JsonSchemaVersion.DRAFT4,
  type: apigateway.JsonSchemaType.OBJECT,
  description: "Extended subsubject model for Open311 service requests",
  properties: {
    active: {
      type: apigateway.JsonSchemaType.NUMBER,
      description: "Is the subject active: 1 if active, 0 if not active",
    },
    name: {
      type: apigateway.JsonSchemaType.STRING,
      description: "Subject name",
    },
    id: {
      type: apigateway.JsonSchemaType.NUMBER,
      description: "Identifier for the subsubject",
    },
    locale: {
      type: apigateway.JsonSchemaType.STRING,
      description: "Locale, e.g. 'en'",
    },
    subjectId: {
      type: apigateway.JsonSchemaType.NUMBER,
      description: "Corresponds to a subject's subject_id",
    },
  },
};

export default schema;
