/* eslint-disable dot-notation */

import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration";
import { DigitrafficMethodResponse } from "@digitraffic/common/dist/aws/infra/api/response";
import { DocumentationPart } from "@digitraffic/common/dist/aws/infra/documentation";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest-api";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { omitDeep } from "@digitraffic/common/dist/utils/utils";
import type { JsonSchema, Model, Resource } from "aws-cdk-lib/aws-apigateway";
import { toJSONSchema } from "zod";
import {
  DirwayFeatureCollectionSchema,
  LocationFeatureCollectionSchema,
  VesselsResponseSchema,
} from "./model/public-api-model.js";

const WN_TAGS_V2 = ["Winter Navigation V2"];

export function create(stack: DigitrafficStack): DigitrafficRestApi {
  const publicApi = new DigitrafficRestApi(stack, "WN-public", "WN public API");

  publicApi.createUsagePlanV2("WN Api Key");

  const v2Resource = createResources(publicApi);

  const locationsSchema = omitDeep(
    toJSONSchema(LocationFeatureCollectionSchema, {
      target: "draft-4",
    }) as JsonSchema,
    "pattern",
  );

  const locationsModel = publicApi.addJsonModel("Locations", locationsSchema);
  const [locationResource, locationsResource] = createLocationResources(
    stack,
    v2Resource,
    locationsModel,
  );

  const vesselsSchema = omitDeep(
    toJSONSchema(VesselsResponseSchema, {
      target: "draft-4",
    }) as JsonSchema,
    "pattern",
  );

  const vesselsModel = publicApi.addJsonModel("Vessels", vesselsSchema);
  const [vesselResource, vesselsResource] = createVesselResources(
    stack,
    v2Resource,
    vesselsModel,
  );

  const dirwaysSchema = omitDeep(
    toJSONSchema(DirwayFeatureCollectionSchema, {
      target: "draft-4",
    }) as JsonSchema,
    "pattern",
  );

  const dirwaysModel = publicApi.addJsonModel("Dirways", dirwaysSchema);
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
    DocumentationPart.queryParameter(
      "activeFrom",
      "An ISO 8601 date-time. Filters for related activities or planned assistances starting or in progress after this time.",
    ),
    DocumentationPart.queryParameter(
      "activeTo",
      "An ISO 8601 date-time. Filters for related activities or planned assistances starting or in progress before this time.",
    ),
    DocumentationPart.pathParameter("vesselId", "IMO or MMSI"),
  );

  publicApi.documentResource(
    vesselsResource,
    DocumentationPart.method(WN_TAGS_V2, "GetVessels", "Return all vessels"),
    DocumentationPart.queryParameter(
      "activeFrom",
      "An ISO 8601 date-time. Filters for vessels with related activities or planned assistances starting or in progress after this time. If omitted, defaults to one week ago.",
    ),
    DocumentationPart.queryParameter(
      "activeTo",
      "An ISO 8601 date-time. Filters for vessels with related activities or planned assistances starting or in progress before this time.",
    ),
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
  const locationResource = locationsResource.addResource("{locode}");

  const getLocationIntegration = new DigitrafficIntegration(
    getLocationsLambda,
    MediaType.APPLICATION_JSON,
  )
    .addPathParameter("locode")
    .build();

  const getLocationsIntegration = new DigitrafficIntegration(
    getLocationsLambda,
    MediaType.APPLICATION_JSON,
  )
    .passAllQueryParameters()
    .build();

  ["GET", "HEAD"].forEach((httpMethod) => {
    locationResource.addMethod(httpMethod, getLocationIntegration, {
      apiKeyRequired: true,
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
      apiKeyRequired: true,
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
      apiKeyRequired: true,
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
      apiKeyRequired: true,
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
      apiKeyRequired: true,
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
