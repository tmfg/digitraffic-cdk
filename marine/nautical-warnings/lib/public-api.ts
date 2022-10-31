import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import { MessageModel } from "@digitraffic/common/dist/aws/infra/api/response";
import { Model, Resource } from "aws-cdk-lib/aws-apigateway";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { DigitrafficLogSubscriptions } from "@digitraffic/common/dist/aws/infra/stack/subscription";
import {
    corsMethod,
    defaultIntegration,
    methodResponse,
} from "@digitraffic/common/dist/aws/infra/api/responses";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import {
    addServiceModel,
    featureSchema,
    geojsonSchema,
    getModelReference,
} from "@digitraffic/common/dist/utils/api-model";
import { nauticalWarningSchema } from "./model/nautical-warnings-schema";
import { DocumentationPart } from "@digitraffic/common/dist/aws/infra/documentation";

const NAUTICAL_WARNING_TAGS_V1 = ["Nautical Warning V1"];

export class PublicApi {
    readonly apiKeyId: string;
    readonly publicApi: DigitrafficRestApi;
    activeResource: Resource;
    archivedResource: Resource;
    geojsonModel: Model;
    errorModel: Model;

    constructor(stack: DigitrafficStack) {
        this.publicApi = new DigitrafficRestApi(
            stack,
            "NauticalWarnings-public",
            "NauticalWarning Public API"
        );
        this.apiKeyId = this.publicApi.createUsagePlanV2(
            "NauticalWarning Api Key"
        );

        this.createResources(this.publicApi);
        this.createEndpoint(stack);
    }

    createResources(publicApi: DigitrafficRestApi) {
        const apiResource = publicApi.root.addResource("api");
        const csResource = apiResource.addResource("nautical-warning");
        const v1Resource = csResource.addResource("v1");
        const warningsResource = v1Resource.addResource("warnings");
        this.activeResource = warningsResource.addResource("active");
        this.archivedResource = warningsResource.addResource("archived");

        const warningModel = addServiceModel(
            "WarningModel",
            publicApi,
            nauticalWarningSchema
        );
        const featureModel = addServiceModel(
            "FeatureModel",
            publicApi,
            featureSchema(
                getModelReference(warningModel.modelId, publicApi.restApiId)
            )
        );
        this.geojsonModel = addServiceModel(
            "GeoJSONResponseModel",
            publicApi,
            geojsonSchema(
                getModelReference(featureModel.modelId, publicApi.restApiId)
            )
        );
        this.errorModel = publicApi.addModel(
            "ErrorResponseModel",
            MessageModel
        );
    }

    createEndpoint(stack: DigitrafficStack) {
        const environment = stack.createLambdaEnvironment();

        const lambdaActive = MonitoredFunction.createV2(
            stack,
            "get-active",
            environment
        );
        const lambdaArchived = MonitoredFunction.createV2(
            stack,
            "get-archived",
            environment
        );

        stack.grantSecret(lambdaActive, lambdaArchived);
        new DigitrafficLogSubscriptions(stack, lambdaActive, lambdaArchived);

        const activeIntegration = defaultIntegration(lambdaActive);
        const archivedIntegration = defaultIntegration(lambdaArchived);

        ["GET", "HEAD"].forEach((httpMethod) => {
            this.activeResource.addMethod(httpMethod, activeIntegration, {
                apiKeyRequired: false,
                methodResponses: [
                    corsMethod(
                        methodResponse(
                            "200",
                            MediaType.APPLICATION_GEOJSON,
                            this.geojsonModel
                        )
                    ),
                    corsMethod(
                        methodResponse(
                            "500",
                            MediaType.TEXT_PLAIN,
                            this.geojsonModel
                        )
                    ),
                ],
            });
        });

        ["GET", "HEAD"].forEach((httpMethod) => {
            this.archivedResource.addMethod(httpMethod, archivedIntegration, {
                apiKeyRequired: false,
                methodResponses: [
                    corsMethod(
                        methodResponse(
                            "200",
                            MediaType.APPLICATION_GEOJSON,
                            this.geojsonModel
                        )
                    ),
                    corsMethod(
                        methodResponse(
                            "500",
                            MediaType.TEXT_PLAIN,
                            this.geojsonModel
                        )
                    ),
                ],
            });
        });

        this.publicApi.documentResource(
            this.activeResource,
            DocumentationPart.method(
                NAUTICAL_WARNING_TAGS_V1,
                "GetActiveNauticalWarnings",
                "Return all active nautical warnings"
            )
        );
        this.publicApi.documentResource(
            this.archivedResource,
            DocumentationPart.method(
                NAUTICAL_WARNING_TAGS_V1,
                "GetArchivedNauticalWarnings",
                "Return all archived nautical warnings"
            )
        );
    }
}
