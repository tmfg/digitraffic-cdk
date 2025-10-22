import type { Model, Resource } from "aws-cdk-lib/aws-apigateway";
import { DocumentationPart } from "@digitraffic/common/dist/aws/infra/documentation";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration";
import { DigitrafficMethodResponse } from "@digitraffic/common/dist/aws/infra/api/response";
import { locationSchema } from "./model/location-schema.js";
import { vesselSchema } from "./model/vessel-schema.js";
import { dirwaySchema } from "./model/dirway-schema.js";

const WN_TAGS_V2 = ["Winter Navigation V2"];

export function create(stack: DigitrafficStack): DigitrafficRestApi {
  const publicApi = new DigitrafficRestApi(stack, "WN-public", "WN public API");

  publicApi.createUsagePlan("WN Api Key", "WN Usage Plan");

  const v2Resource = createResources(publicApi);

  const locationsModel = publicApi.addJsonModel(
    "LocationsModel",
    locationSchema,
  );
  const [locationResource, locationsResource] = createLocationResources(
    stack,
    v2Resource,
    locationsModel,
  );

  const vesselsModel = publicApi.addJsonModel("VesselsModel", vesselSchema);
  const [vesselResource, vesselsResource] = createVesselResources(
    stack,
    v2Resource,
    vesselsModel,
  );

  const dirwaysModel = publicApi.addJsonModel("DirwaysModel", dirwaySchema);
  const dirwaysResource = createDirwayResources(
    stack,
    v2Resource,
    dirwaysModel,
  );

  publicApi.documentResource(
    locationResource,
    DocumentationPart.method(WN_TAGS_V2, "GetLocation", "Return one location"),
  );

  publicApi.documentResource(
    locationsResource,
    DocumentationPart.method(
      WN_TAGS_V2,
      "GetLocations",
      "Return all locations",
    ),
  );

  publicApi.documentResource(
    vesselResource,
    DocumentationPart.method(WN_TAGS_V2, "GetVessel", "Return one vessel"),
  );

  publicApi.documentResource(
    vesselsResource,
    DocumentationPart.method(WN_TAGS_V2, "GetVessels", "Return all vessels"),
  );

  publicApi.documentResource(
    dirwaysResource,
    DocumentationPart.method(WN_TAGS_V2, "GetDirways", "Return all dirways"),
  );

  return publicApi;
}

function createResources(publicApi: DigitrafficRestApi): Resource {
  const apiResource = publicApi.root.addResource("api");
  const wnResource = apiResource.addResource("winter-navigation");
  return publicApi.addResourceWithCorsOptionsSubTree(wnResource, "v2");
}

function createLocationResources(
  stack: DigitrafficStack,
  v2Resource: Resource,
  locationsModel: Model,
): [Resource, Resource] {
  const getLocationsLambda = MonitoredDBFunction.create(
    stack,
    "get-locations",
    undefined,
    {
      memorySize: 256,
      reservedConcurrentExecutions: 6,
    },
  );

  const locationsResource = v2Resource.addResource("locations");
  const locationResource = locationsResource.addResource("{locationId}");

  const getLocationIntegration = new DigitrafficIntegration(
    getLocationsLambda,
    MediaType.APPLICATION_JSON,
  )
    .addPathParameter("locationId")
    .build();

  const getLocationsIntegration = new DigitrafficIntegration(
    getLocationsLambda,
    MediaType.APPLICATION_JSON,
  )
    .passAllQueryParameters()
    .build();

  ["GET", "HEAD"].forEach((httpMethod) => {
    locationResource.addMethod(httpMethod, getLocationIntegration, {
      //            apiKeyRequired: true,
      methodResponses: [
        DigitrafficMethodResponse.response200(
          locationsModel,
          MediaType.APPLICATION_JSON,
        ),
        DigitrafficMethodResponse.response400(),
        DigitrafficMethodResponse.response500(),
      ],
    });

    locationsResource.addMethod(httpMethod, getLocationsIntegration, {
      //            apiKeyRequired: true,
      methodResponses: [
        DigitrafficMethodResponse.response200(
          locationsModel,
          MediaType.APPLICATION_JSON,
        ),
        DigitrafficMethodResponse.response400(),
        DigitrafficMethodResponse.response500(),
      ],
    });
  });

  return [locationResource, locationsResource];
}

function createVesselResources(
  stack: DigitrafficStack,
  v2Resource: Resource,
  locationsModel: Model,
): [Resource, Resource] {
  const getVesselsLambda = MonitoredDBFunction.create(
    stack,
    "get-vessels",
    undefined,
    {
      memorySize: 512,
      reservedConcurrentExecutions: 6,
    },
  );

  const vesselsResource = v2Resource.addResource("vessels");
  const vesselResource = vesselsResource.addResource("{vesselId}");

  const getVesselIntegration = new DigitrafficIntegration(
    getVesselsLambda,
    MediaType.APPLICATION_JSON,
  )
    .addPathParameter("vesselId")
    .addQueryParameter("activeFrom")
    .addQueryParameter("activeTo")
    .build();

  const getVesselsIntegration = new DigitrafficIntegration(
    getVesselsLambda,
    MediaType.APPLICATION_JSON,
  )
    .addQueryParameter("activeFrom")
    .addQueryParameter("activeTo")
    .build();

  ["GET", "HEAD"].forEach((httpMethod) => {
    vesselResource.addMethod(httpMethod, getVesselIntegration, {
      //            apiKeyRequired: true,
      requestParameters: {
        "method.request.querystring.activeFrom": false,
        "method.request.querystring.activeTo": false,
      },
      methodResponses: [
        DigitrafficMethodResponse.response200(
          locationsModel,
          MediaType.APPLICATION_JSON,
        ),
        DigitrafficMethodResponse.response400(),
        DigitrafficMethodResponse.response500(),
      ],
    });

    vesselsResource.addMethod(httpMethod, getVesselsIntegration, {
      //            apiKeyRequired: true,
      requestParameters: {
        "method.request.querystring.activeFrom": false,
        "method.request.querystring.activeTo": false,
      },
      methodResponses: [
        DigitrafficMethodResponse.response200(
          locationsModel,
          MediaType.APPLICATION_JSON,
        ),
        DigitrafficMethodResponse.response400(),
        DigitrafficMethodResponse.response500(),
      ],
    });
  });

  return [vesselResource, vesselsResource];
}

function createDirwayResources(
  stack: DigitrafficStack,
  v2Resource: Resource,
  dirwaysModel: Model,
): Resource {
  const getDirwaysLambda = MonitoredDBFunction.create(
    stack,
    "get-dirways",
    undefined,
    {
      memorySize: 256,
      reservedConcurrentExecutions: 6,
    },
  );

  const dirwaysResource = v2Resource.addResource("dirways");

  const getDirwaysIntegration = new DigitrafficIntegration(
    getDirwaysLambda,
    MediaType.APPLICATION_JSON,
  )
    .passAllQueryParameters()
    .build();

  ["GET", "HEAD"].forEach((httpMethod) => {
    dirwaysResource.addMethod(httpMethod, getDirwaysIntegration, {
      //            apiKeyRequired: true,
      methodResponses: [
        DigitrafficMethodResponse.response200(
          dirwaysModel,
          MediaType.APPLICATION_JSON,
        ),
        DigitrafficMethodResponse.response400(),
        DigitrafficMethodResponse.response500(),
      ],
    });
  });

  return dirwaysResource;
}
