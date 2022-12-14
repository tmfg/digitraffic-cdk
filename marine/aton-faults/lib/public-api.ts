import { Model, Resource, RestApi } from "aws-cdk-lib/aws-apigateway";
import { faultsSchema } from "./model/fault-schema";
import {
    corsMethod,
    methodResponse,
} from "@digitraffic/common/dist/aws/infra/api/responses";
import {
    featureSchema,
    geojsonSchema,
    getModelReference,
} from "@digitraffic/common/dist/utils/api-model";
import { DocumentationPart } from "@digitraffic/common/dist/aws/infra/documentation";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration";
import { DigitrafficMethodResponse } from "@digitraffic/common/dist/aws/infra/api/response";

const ATON_FAULT_TAGS_V1 = ["Aton Fault V1"];

export function create(stack: DigitrafficStack): DigitrafficRestApi {
    const publicApi = new DigitrafficRestApi(
        stack,
        "ATON-public",
        "ATON public API"
    );

    publicApi.createUsagePlan("ATON Api Key", "ATON Usage Plan");

    const faultModel = publicApi.addJsonModel("FaultModel", faultsSchema);
    const featureModel = publicApi.addJsonModel(
        "FeatureModel",
        featureSchema(
            getModelReference(faultModel.modelId, publicApi.restApiId)
        )
    );
    const faultsModel = publicApi.addJsonModel(
        "FaultsModel",
        geojsonSchema(
            getModelReference(featureModel.modelId, publicApi.restApiId)
        )
    );

    const faultsResource = createFaultsResource(stack, publicApi, faultsModel);

    publicApi.documentResource(
        faultsResource,
        DocumentationPart.method(
            ATON_FAULT_TAGS_V1,
            "GetActiveFaults",
            "Return all active faults in GeoJSON"
        )
    );
    publicApi.documentResource(
        faultsResource,
        DocumentationPart.queryParameter(
            "language",
            "Language: en, fi or sv (default en)"
        )
    );
    publicApi.documentResource(
        faultsResource,
        DocumentationPart.queryParameter(
            "fixed_in_hours",
            "Show faults that are unfixed or were fixed at most this many hours ago (default 7 days).  Must be between 0 and 2400"
        )
    );

    return publicApi;
}

function createFaultsResource(
    stack: DigitrafficStack,
    publicApi: RestApi,
    faultsJsonModel: Model
): Resource {
    const getFaultsLambda = MonitoredDBFunction.create(
        stack,
        "get-faults",
        undefined,
        {
            memorySize: 256,
            reservedConcurrentExecutions: 6,
        }
    );

    const apiResource = publicApi.root.addResource("api");
    const atonResource = apiResource.addResource("aton");
    const v1Resource = atonResource.addResource("v1");
    const faultsResource = v1Resource.addResource("faults");

    const getFaultsIntegration = new DigitrafficIntegration(
        getFaultsLambda,
        MediaType.APPLICATION_GEOJSON
    )
        .addQueryParameter("language")
        .addQueryParameter("fixed_in_hours")
        .build();

    ["GET", "HEAD"].forEach((httpMethod) => {
        faultsResource.addMethod(httpMethod, getFaultsIntegration, {
            apiKeyRequired: true,
            requestParameters: {
                "method.request.querystring.language": false,
                "method.request.querystring.fixed_in_hours": false,
            },
            methodResponses: [
                DigitrafficMethodResponse.response200(
                    faultsJsonModel,
                    MediaType.APPLICATION_GEOJSON
                ),
                DigitrafficMethodResponse.response400(),
                DigitrafficMethodResponse.response500(),
            ],
        });
    });

    return faultsResource;
}
