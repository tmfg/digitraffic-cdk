import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import {
  DigitrafficMethodResponse,
  MessageModel,
} from "@digitraffic/common/dist/aws/infra/api/response";
import type { Model, Resource } from "aws-cdk-lib/aws-apigateway";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import {
  addServiceModel,
  featureSchema,
  geojsonSchema,
  getModelReference,
} from "@digitraffic/common/dist/utils/api-model";
import { nauticalWarningSchema } from "./model/nautical-warnings-schema.js";
import { DocumentationPart } from "@digitraffic/common/dist/aws/infra/documentation";
import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration";
import type { NauticalWarningConfiguration } from "./nautical-warnings-stack.js";

const NAUTICAL_WARNING_TAGS_V1 = ["Nautical Warning V1"];

export class PublicApi {
  readonly apiKeyId: string;
  readonly publicApi: DigitrafficRestApi;
  activeResource!: Resource;
  archivedResource!: Resource;
  geojsonModel!: Model;
  errorModel!: Model;

  constructor(stack: DigitrafficStack) {
    this.publicApi = new DigitrafficRestApi(
      stack,
      "NauticalWarnings-public",
      "NauticalWarning Public API",
    );
    this.apiKeyId = this.publicApi.createUsagePlanV2(
      "NauticalWarning",
      (stack.configuration as NauticalWarningConfiguration).apiKey,
    );

    this.createResources(this.publicApi);
    this.createEndpoint(stack);

    this.publicApi.exportEndpoint();
  }

  createResources(publicApi: DigitrafficRestApi): void {
    const apiResource = publicApi.root.addResource("api");
    const csResource = apiResource.addResource("nautical-warning");
    const v1Resource = publicApi.addResourceWithCorsOptionsSubTree(
      csResource,
      "v1",
    );
    const warningsResource = v1Resource.addResource("warnings");
    this.activeResource = warningsResource.addResource("active");
    this.archivedResource = warningsResource.addResource("archived");

    const warningModel = addServiceModel(
      "WarningModel",
      publicApi,
      nauticalWarningSchema,
    );
    const featureModel = addServiceModel(
      "FeatureModel",
      publicApi,
      featureSchema(
        getModelReference(warningModel.modelId, publicApi.restApiId),
      ),
    );
    this.geojsonModel = addServiceModel(
      "GeoJSONResponseModel",
      publicApi,
      geojsonSchema(
        getModelReference(featureModel.modelId, publicApi.restApiId),
      ),
    );
    this.errorModel = publicApi.addModel("ErrorResponseModel", MessageModel);
  }

  createEndpoint(stack: DigitrafficStack): void {
    const lambdaActive = MonitoredDBFunction.create(stack, "get-active");
    const lambdaArchived = MonitoredDBFunction.create(stack, "get-archived");

    const activeIntegration = new DigitrafficIntegration(
      lambdaActive,
      MediaType.APPLICATION_GEOJSON,
      // set deprecation
      true,
    ).build();
    const archivedIntegration = new DigitrafficIntegration(
      lambdaArchived,
      MediaType.APPLICATION_GEOJSON,
      // set deprecation
      true,
    ).build();

    ["GET", "HEAD"].forEach((httpMethod) => {
      this.activeResource.addMethod(httpMethod, activeIntegration, {
        apiKeyRequired: true,
        methodResponses: [
          DigitrafficMethodResponse.response200(
            this.geojsonModel,
            MediaType.APPLICATION_GEOJSON,
            // set deprecation
            true,
          ),
          DigitrafficMethodResponse.response500(),
        ],
      });
    });

    ["GET", "HEAD"].forEach((httpMethod) => {
      this.archivedResource.addMethod(httpMethod, archivedIntegration, {
        apiKeyRequired: true,
        methodResponses: [
          DigitrafficMethodResponse.response200(
            this.geojsonModel,
            MediaType.APPLICATION_GEOJSON,
            // set deprecation
            true,
          ),
          DigitrafficMethodResponse.response500(),
        ],
      });
    });

    this.publicApi.documentResource(
      this.activeResource,
      DocumentationPart.method(
        NAUTICAL_WARNING_TAGS_V1,
        "GetActiveNauticalWarnings",
        "Return all active nautical warnings. Will be removed beginning of 2026.",
      ),
    );
    this.publicApi.documentResource(
      this.archivedResource,
      DocumentationPart.method(
        NAUTICAL_WARNING_TAGS_V1,
        "GetArchivedNauticalWarnings",
        "Return all archived nautical warnings. Will be removed beginning of 2026.",
      ),
    );
  }
}
