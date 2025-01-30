import type { Model } from "aws-cdk-lib/aws-apigateway";

/**
 * Model object with a reference to an API Gateway model object.
 */
export interface ModelWithReference extends Model {
  modelReference: string;
}
