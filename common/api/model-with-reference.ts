import {Model} from "@aws-cdk/aws-apigateway";

/**
 * Model object with a reference to an API Gateway model object.
 */
export interface ModelWithReference extends Model {
    modelReference: string;
}
