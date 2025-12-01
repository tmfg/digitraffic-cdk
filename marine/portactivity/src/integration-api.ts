import { DocumentationPart } from "@digitraffic/common/dist/aws/infra/documentation";
import { attachQueueToApiGatewayResource } from "@digitraffic/common/dist/aws/infra/sqs-integration";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest-api";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import {
  addServiceModel,
  getModelReference,
} from "@digitraffic/common/dist/utils/api-model";
import type { Model, RestApi } from "aws-cdk-lib/aws-apigateway";
import { RequestValidator } from "aws-cdk-lib/aws-apigateway";
import type { Queue } from "aws-cdk-lib/aws-sqs";
import type { Construct } from "constructs";
import {
  createTimestampSchema,
  LocationSchema,
  ShipSchema,
} from "./model/timestamp-schema.js";

export function create(queue: Queue, stack: DigitrafficStack): void {
  const integrationApi = new DigitrafficRestApi(
    stack,
    "PortActivity-Integration",
    "Port Activity integration API",
  );
  const shipModel = addServiceModel("ShipModel", integrationApi, ShipSchema);
  const locationModel = addServiceModel(
    "LocationModel",
    integrationApi,
    LocationSchema,
  );
  const timestampModel = addServiceModel(
    "TimestampModel",
    integrationApi,
    createTimestampSchema(
      getModelReference(shipModel.modelId, integrationApi.restApiId),
      getModelReference(locationModel.modelId, integrationApi.restApiId),
    ),
  );
  createUpdateTimestampResource(stack, integrationApi, queue, timestampModel);
  createUsagePlan(integrationApi);
}

function createUpdateTimestampResource(
  stack: Construct,
  integrationApi: DigitrafficRestApi,
  queue: Queue,
  timestampModel: Model,
): void {
  const apiResource = integrationApi.root.addResource("api");
  const integrationResource = apiResource.addResource("integration");
  const timestampResource = integrationResource.addResource("timestamps");
  const requestValidator = new RequestValidator(stack, "RequestValidator", {
    validateRequestBody: true,
    validateRequestParameters: true,
    requestValidatorName: "PortActivityTimestampIntegrationRequestValidator",
    restApi: integrationApi,
  });
  attachQueueToApiGatewayResource(
    stack,
    queue,
    timestampResource,
    requestValidator,
    "PortCallTimestamp",
    true,
    {
      "application/json": timestampModel,
    },
  );

  integrationApi.documentResource(
    timestampResource,
    DocumentationPart.method(
      ["timestamps"],
      "UpdateTimestamp",
      "Updates a single ship timestamp",
    ),
  );
}

function createUsagePlan(integrationApi: RestApi): void {
  const apiKey = integrationApi.addApiKey("Port Activity Integration API key");
  const plan = integrationApi.addUsagePlan(
    "Port Activity Integration Usage Plan",
    {
      name: "Integration Usage Plan",
    },
  );
  plan.addApiStage({
    stage: integrationApi.deploymentStage,
  });
  plan.addApiKey(apiKey);
}
