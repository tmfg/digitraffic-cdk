import type { JsonSchema, Model, RestApi } from "aws-cdk-lib/aws-apigateway";
import { JsonSchemaType, JsonSchemaVersion } from "aws-cdk-lib/aws-apigateway";

export type Datex2PublicationType =
  | "SituationPublication"
  | "VmsPublication"
  | "VmsTablePublication";

const PUBLICATION_DESCRIPTIONS: Record<Datex2PublicationType, string> = {
  SituationPublication: "sit:situationPublication",
  VmsPublication: 'd2:payload xsi:type="vms:VmsPublication"',
  VmsTablePublication: 'd2:payload xsi:type="vms:VmsTablePublication"',
};

/**
 * Adds an API Gateway model for a Datex II XML response.
 * Note: externalDocs is not supported by API Gateway model schema validation.
 * See official docs at https://docs.datex2.eu/downloads/modelv35/ or modelv37/
 *
 * @param api             REST API instance
 * @param version         Datex II version, e.g. "3.5" or "3.7"
 * @param publicationType Publication type determining the root element description
 */
export function addDatex2XmlModel(
  api: RestApi,
  version: string,
  publicationType: Datex2PublicationType,
): Model {
  const versionSuffix = version.replace(".", "");
  const modelName = `${publicationType}${versionSuffix}Model`;
  const rootElement = PUBLICATION_DESCRIPTIONS[publicationType];

  const schema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.STRING,
    description: `Datex II ${version} XML response. Root element: \`${rootElement}\`. [View schema documentation](https://docs.datex2.eu/downloads/modelv${versionSuffix}/)`,
  };

  return api.addModel(modelName, {
    contentType: "application/xml",
    modelName,
    schema,
  });
}
