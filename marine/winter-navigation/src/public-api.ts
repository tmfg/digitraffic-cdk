import type { Model, Resource } from "aws-cdk-lib/aws-apigateway";
import { DocumentationPart } from "@digitraffic/common/dist/aws/infra/documentation";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration";
import { DigitrafficMethodResponse } from "@digitraffic/common/dist/aws/infra/api/response";
import { locationSchema } from "./model/location-schema.js";

const WN_TAGS_V2 = ["Winter Navigation V2"];

export function create(stack: DigitrafficStack): DigitrafficRestApi {
    const publicApi = new DigitrafficRestApi(stack, "WN-public", "WN public API");

    publicApi.createUsagePlan("WN Api Key", "WN Usage Plan");

    const locationsModel = publicApi.addJsonModel("LocationsModel", locationSchema);
    const locationsResource = createLocationsResource(stack, publicApi, locationsModel);

    publicApi.documentResource(
        locationsResource,
        DocumentationPart.method(WN_TAGS_V2, "GetLocations", "Return all locations")
    );

    return publicApi;
}

function createLocationsResource(stack: DigitrafficStack, publicApi: DigitrafficRestApi, locationsModel: Model): Resource {
    const getLocationsLambda = MonitoredDBFunction.create(stack, "get-locations", undefined, {
        memorySize: 256,
        reservedConcurrentExecutions: 6
    });

    const apiResource = publicApi.root.addResource("api");
    const wnResource = apiResource.addResource("wn");
    const v2Resource = publicApi.addResourceWithCorsOptionsSubTree(wnResource,"v2");
    const locationsResource = v2Resource.addResource("locations");

    const getLocationsIntegration = new DigitrafficIntegration(getLocationsLambda, MediaType.APPLICATION_JSON)
        .passAllQueryParameters()
        .build();

    ["GET", "HEAD"].forEach((httpMethod) => {
        locationsResource.addMethod(httpMethod, getLocationsIntegration, {
//            apiKeyRequired: true,
            requestParameters: {
                "method.request.querystring.language": false,
                "method.request.querystring.fixed_in_hours": false
            },
            methodResponses: [
                DigitrafficMethodResponse.response200(locationsModel, MediaType.APPLICATION_JSON),
                DigitrafficMethodResponse.response400(),
                DigitrafficMethodResponse.response500()
            ]
        });
    });

    return locationsResource;
}
