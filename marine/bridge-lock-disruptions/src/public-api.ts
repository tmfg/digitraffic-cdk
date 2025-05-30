import type { IModel, Resource } from "aws-cdk-lib/aws-apigateway";
import { default as DisruptionSchema } from "./model/disruption-schema.js";
import {
  addServiceModel,
  featureSchema,
  geojsonSchema,
  getModelReference,
} from "@digitraffic/common/dist/utils/api-model";
import { DocumentationPart } from "@digitraffic/common/dist/aws/infra/documentation";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration";
import { DigitrafficMethodResponse } from "@digitraffic/common/dist/aws/infra/api/response";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import { createUsagePlan } from "@digitraffic/common/dist/aws/infra/usage-plans";

const BRIDGE_LOCK_DISRUPTION_TAGS_V1 = ["Bridge Lock Disruption V1"];

export class PublicApi {
  // @ts-ignore
  disruptionsResource: Resource;

  constructor(stack: DigitrafficStack) {
    const publicApi = this.createApi(stack);

    // eslint-disable-next-line deprecation/deprecation
    createUsagePlan(publicApi, "BridgeLock Api Key", "BridgeLock Usage Plan");

    const disruptionModel = addServiceModel(
      "DisruptionModel",
      publicApi,
      DisruptionSchema,
    );
    const featureModel = addServiceModel(
      "DisruptionFeatureModel",
      publicApi,
      featureSchema(
        getModelReference(disruptionModel.modelId, publicApi.restApiId),
      ),
    );
    const disruptionsModel = addServiceModel(
      "DisruptionsModel",
      publicApi,
      geojsonSchema(
        getModelReference(featureModel.modelId, publicApi.restApiId),
      ),
    );

    this.createResourcePaths(publicApi);
    this.createDisruptionsResource(disruptionsModel, stack);

    publicApi.documentResource(
      // @ts-ignore
      this.disruptionsResource,
      DocumentationPart.method(
        BRIDGE_LOCK_DISRUPTION_TAGS_V1,
        "getDisruptions",
        "Return all waterway traffic disruptions",
      ),
    );
  }

  createDisruptionsResource(
    disruptionsJsonModel: IModel,
    stack: DigitrafficStack,
  ): void {
    const getDisruptionsLambda = MonitoredDBFunction.create(
      stack,
      "get-disruptions",
    );
    const getDisruptionsIntegration = new DigitrafficIntegration(
      getDisruptionsLambda,
      MediaType.APPLICATION_JSON,
    ).build();

    ["GET", "HEAD"].forEach((httpMethod) => {
      [this.disruptionsResource].forEach((resource) => {
        resource.addMethod(httpMethod, getDisruptionsIntegration, {
          apiKeyRequired: true,
          methodResponses: [
            DigitrafficMethodResponse.response200(
              disruptionsJsonModel,
              MediaType.APPLICATION_JSON,
            ),
          ],
        });
      });
    });
  }

  createResourcePaths(publicApi: DigitrafficRestApi): void {
    const apiResource = publicApi.root.addResource("api");

    // new paths
    const bridgeLockResource = apiResource.addResource("bridge-lock");
    const v1Resource = publicApi.addResourceWithCorsOptionsSubTree(
      bridgeLockResource,
      "v1",
    );
    this.disruptionsResource = v1Resource.addResource("disruptions");
  }

  createApi(stack: DigitrafficStack): DigitrafficRestApi {
    return new DigitrafficRestApi(
      stack,
      "BridgeLockDisruption-public",
      "BridgeLockDisruption public API",
    );
  }
}
