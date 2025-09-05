import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import {
  JsonSchemaType,
  type Model,
  type Resource,
} from "aws-cdk-lib/aws-apigateway";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { DocumentationPart } from "@digitraffic/common/dist/aws/infra/documentation";
import {
  featureSchema,
  geojsonSchema,
  getModelReference,
} from "@digitraffic/common/dist/utils/api-model";
import { DigitrafficStaticIntegration } from "@digitraffic/common/dist/aws/infra/api/static-integration";
import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration";
import { DigitrafficMethodResponse } from "@digitraffic/common/dist/aws/infra/api/response";
import { AllDirections, AllDomains, AllTravelModes } from "./model/v2/types.js";
import {
  directionsSchema,
  domainsSchema,
  siteSchema,
  travelModesSchema,
  valueSchema,
} from "./model/v2/json-schemas.js";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

const COUNTING_SITE_TAGS_V2 = ["Counting site V2"];

export class PublicApiV2 {
  publicApi: DigitrafficRestApi;

  constructor(stack: DigitrafficStack) {
    this.publicApi = new DigitrafficRestApi(
      stack,
      "CountingSite-public-v2",
      "Counting Site Public API V2",
    );
    const apiKeyId = this.publicApi.createUsagePlan(
      "CS V2 Api Key",
      "CS Usage Plan",
    );
    this.exportApi(stack, apiKeyId);

    const v2Resource = this.createResources(this.publicApi);

    this.createTravelModesEndpoint(v2Resource);
    this.createDirectionsEndpoint(v2Resource);
    this.createDomainsEndpoint(v2Resource);
    this.createValuesEndpoint(stack, v2Resource);
    this.createCsvValuesEndpoint(stack, v2Resource);
    this.createSitesEndpoint(stack, v2Resource);
  }

  exportApi(stack: DigitrafficStack, apiKeyId: string): void {
    new StringParameter(stack, "export.endpoint", {
      parameterName:
        `/digitraffic/${stack.configuration.shortName}/endpointUrl`,
      stringValue: this.publicApi.url,
    });

    new StringParameter(stack, "export.apiKeyId", {
      parameterName: `/digitraffic/${stack.configuration.shortName}/apiKeyId`,
      stringValue: apiKeyId,
    });
  }

  createResources(publicApi: DigitrafficRestApi): Resource {
    const apiResource = publicApi.root.addResource("api");
    const csResource = apiResource.addResource("counting-site");

    return publicApi.addResourceWithCorsOptionsSubTree(csResource, "v2");
  }

  createTravelModesEndpoint(v2Resource: Resource): void {
    const travelModesResource = v2Resource.addResource("travel-modes");
    const travelModesResponseModel = this.publicApi.addJsonModel(
      "TravelModesResponseModel",
      travelModesSchema,
    );
    const headers = { "Last-Modified": new Date().toUTCString() };

    DigitrafficStaticIntegration.json(
      travelModesResource,
      AllTravelModes,
      travelModesResponseModel,
      true,
      true,
      headers,
    );

    this.publicApi.documentResource(
      travelModesResource,
      DocumentationPart.method(
        COUNTING_SITE_TAGS_V2,
        "GetTravelModes",
        "Return all travel modes",
      ),
    );
  }

  createGeoJsonResponseModel(): Model {
    const siteModel = this.publicApi.addJsonModel("SiteModel", siteSchema);
    const featureModel = this.publicApi.addJsonModel(
      "SiteFeatureModel",
      featureSchema(
        getModelReference(siteModel.modelId, this.publicApi.restApiId),
      ),
    );
    const geojsonSchemaWithDataUpdatedTime = geojsonSchema(
      getModelReference(featureModel.modelId, this.publicApi.restApiId),
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (geojsonSchemaWithDataUpdatedTime as any).properties.dataUpdatedTime = {
      type: JsonSchemaType.STRING,
      format: "date-time",
      description: "Data updated timestamp",
    };

    return this.publicApi.addJsonModel(
      "SitesModel",
      geojsonSchemaWithDataUpdatedTime,
    );
  }

  createSitesEndpoint(stack: DigitrafficStack, v2Resource: Resource): void {
    const sitesResource = v2Resource.addResource("sites");
    const siteResource = sitesResource.addResource("{siteId}");

    const lambda = MonitoredDBFunction.create(stack, "get-sites");

    const sitesIntegration = new DigitrafficIntegration(
      lambda,
      MediaType.APPLICATION_GEOJSON,
    )
      .passAllQueryParameters()
      .build();

    const siteIntegration = new DigitrafficIntegration(
      lambda,
      MediaType.APPLICATION_GEOJSON,
    )
      .addPathParameter("siteId")
      .passAllQueryParameters()
      .build();

    const geoJsonResponseModel = this.createGeoJsonResponseModel();

    ["GET", "HEAD"].forEach((httpMethod) => {
      siteResource.addMethod(httpMethod, siteIntegration, {
        apiKeyRequired: true,
        methodResponses: [
          DigitrafficMethodResponse.response200(
            geoJsonResponseModel,
            MediaType.APPLICATION_GEOJSON,
          ),
          DigitrafficMethodResponse.response500(),
        ],
      });

      sitesResource.addMethod(httpMethod, sitesIntegration, {
        apiKeyRequired: true,
        requestParameters: {
          "method.request.querystring.domain": false,
        },
        methodResponses: [
          DigitrafficMethodResponse.response200(
            geoJsonResponseModel,
            MediaType.APPLICATION_GEOJSON,
          ),
          DigitrafficMethodResponse.response500(),
        ],
      });
    });

    this.publicApi.documentResource(
      sitesResource,
      DocumentationPart.method(
        COUNTING_SITE_TAGS_V2,
        "GetSites",
        "Return all sites",
      ),
      DocumentationPart.queryParameter("domain", "Site domain"),
    );

    this.publicApi.documentResource(
      siteResource,
      DocumentationPart.method(
        COUNTING_SITE_TAGS_V2,
        "GetSite",
        "Return one site",
      ),
      DocumentationPart.pathParameter("siteId", "Site id"),
    );
  }

  createValuesEndpoint(stack: DigitrafficStack, v2Resource: Resource): void {
    const valuesResource = v2Resource.addResource("values");

    const lambda = MonitoredDBFunction.create(
      stack,
      "get-values",
      stack.createLambdaEnvironment(),
      {
        memorySize: 192,
      },
    );

    const integration = new DigitrafficIntegration(
      lambda,
      MediaType.APPLICATION_JSON,
    )
      .passAllQueryParameters()
      .build();

    const jsonValuesResponseModel = this.publicApi.addJsonModel(
      "JsonDataResponseModel",
      valueSchema,
    );

    ["GET", "HEAD"].forEach((httpMethod) => {
      valuesResource.addMethod(httpMethod, integration, {
        apiKeyRequired: true,
        requestParameters: {
          "method.request.querystring.siteId": false,
          "method.request.querystring.date": false,
          "method.request.querystring.travelMode": false,
        },
        methodResponses: [
          DigitrafficMethodResponse.response200(jsonValuesResponseModel),
          DigitrafficMethodResponse.response500(),
        ],
      });
    });

    this.publicApi.documentResource(
      valuesResource,
      DocumentationPart.method(
        COUNTING_SITE_TAGS_V2,
        "GetData",
        "Return counter values.",
      ),
      DocumentationPart.queryParameter("siteId", "Site id"),
      DocumentationPart.queryParameter("date", "Date.  Default yesterday."),
      DocumentationPart.queryParameter("travelMode", "Travel Mode"),
    );
  }

  createCsvValuesEndpoint(stack: DigitrafficStack, v2Resource: Resource): void {
    const csvValuesResource = v2Resource.addResource("values.csv");

    const lambda = MonitoredDBFunction.create(
      stack,
      "get-values-csv",
      undefined,
      {
        memorySize: 256,
      },
    );

    const csvValuesResponseModel = this.publicApi.addCSVModel("CSVDataModel");

    const integration = new DigitrafficIntegration(
      lambda,
      MediaType.APPLICATION_JSON,
    )
      .passAllQueryParameters()
      .build();

    ["GET", "HEAD"].forEach((httpMethod) => {
      csvValuesResource.addMethod(httpMethod, integration, {
        apiKeyRequired: true,
        requestParameters: {
          "method.request.querystring.siteId": true,
          "method.request.querystring.year": true,
          "method.request.querystring.month": true,
          "method.request.querystring.travelMode": false,
        },
        methodResponses: [
          DigitrafficMethodResponse.response200(
            csvValuesResponseModel,
            MediaType.TEXT_CSV,
          ),
          DigitrafficMethodResponse.response500(),
        ],
      });
    });

    this.publicApi.documentResource(
      csvValuesResource,
      DocumentationPart.method(
        COUNTING_SITE_TAGS_V2,
        "GetDataCSV",
        "Return counter values in CSV.",
      ),
      DocumentationPart.queryParameter("siteId", "Site id"),
      DocumentationPart.queryParameter("year", "Year"),
      DocumentationPart.queryParameter("month", "Month"),
      DocumentationPart.queryParameter("travelMode", "Travelmode"),
    );
  }

  createDirectionsEndpoint(v2Resource: Resource): void {
    const directionsResource = v2Resource.addResource("directions");
    const directionsResponseModel = this.publicApi.addJsonModel(
      "DirectionsResponseModel",
      directionsSchema,
    );
    const headers = { "Last-Modified": new Date().toUTCString() };

    DigitrafficStaticIntegration.json(
      directionsResource,
      AllDirections,
      directionsResponseModel,
      true,
      true,
      headers,
    );

    this.publicApi.documentResource(
      directionsResource,
      DocumentationPart.method(
        COUNTING_SITE_TAGS_V2,
        "GetDirections",
        "Return all directions",
      ),
    );
  }

  createDomainsEndpoint(v2Resource: Resource): void {
    const domainsResource = v2Resource.addResource("domains");
    const domainsResponseModel = this.publicApi.addJsonModel(
      "DomainsResponseModel",
      domainsSchema,
    );
    const headers = { "Last-Modified": new Date().toUTCString() };

    DigitrafficStaticIntegration.json(
      domainsResource,
      AllDomains,
      domainsResponseModel,
      true,
      true,
      headers,
    );

    this.publicApi.documentResource(
      domainsResource,
      DocumentationPart.method(
        COUNTING_SITE_TAGS_V2,
        "GetDomains",
        "Return all domains",
      ),
    );
  }
}
