import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import { Model, Resource } from "aws-cdk-lib/aws-apigateway";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { DocumentationPart } from "@digitraffic/common/dist/aws/infra/documentation";
import { directionProperties, domainsProperties, userTypesProperties } from "./model/metadata";
import { dataProperties } from "./model/data";
import { featureSchema, geojsonSchema, getModelReference } from "@digitraffic/common/dist/utils/api-model";
import { counterProperties } from "./model/counter";
import { DigitrafficStaticIntegration } from "@digitraffic/common/dist/aws/infra/api/static-integration";
import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration";
import { DigitrafficMethodResponse } from "@digitraffic/common/dist/aws/infra/api/response";

const COUNTING_SITE_TAGS_V1 = ["Counting site V1"];

export class PublicApi {
    publicApi: DigitrafficRestApi;

    valuesResource: Resource;
    csvValuesResource: Resource;
    countersResource: Resource;
    counterResource: Resource;

    userTypesResource: Resource;
    domainsResource: Resource;
    directionsResource: Resource;

    userTypesResponseModel: Model;
    domainsResponseModel: Model;
    directionsResponseModel: Model;
    jsonValuesResponseModel: Model;
    geoJsonResponseModel: Model;
    csvValuesResponseModel: Model;

    constructor(stack: DigitrafficStack) {
        this.publicApi = new DigitrafficRestApi(stack, "CountingSite-public", "Counting Site Public API");
        this.publicApi.createUsagePlan("CS Api Key", "CS Usage Plan");

        this.createResources(this.publicApi);
        this.createModels(this.publicApi);

        this.createUserTypesEndpoint(stack);
        this.createDomainsEndpoint(stack);
        this.createDirectionsEndpoint();
        this.createValuesEndpoint(stack);
        this.createCsvValuesEndpoint(stack);
        this.createCountersEndpoint(stack);
        this.createCounterEndpoint(stack);

        this.createDocumentation();
    }

    createDocumentation(): void {
        this.publicApi.documentResource(
            this.userTypesResource,
            DocumentationPart.method(COUNTING_SITE_TAGS_V1, "GetUserTypes", "Return all user types")
        );
        this.publicApi.documentResource(
            this.domainsResource,
            DocumentationPart.method(COUNTING_SITE_TAGS_V1, "GetDomains", "Return all domains")
        );
        this.publicApi.documentResource(
            this.directionsResource,
            DocumentationPart.method(COUNTING_SITE_TAGS_V1, "GetDirections", "Return all directions")
        );

        this.publicApi.documentResource(
            this.countersResource,
            DocumentationPart.method(COUNTING_SITE_TAGS_V1, "GetCounters", "Return all counters for domain"),
            DocumentationPart.queryParameter("domain_name", "Domain name")
        );

        this.publicApi.documentResource(
            this.counterResource,
            DocumentationPart.method(COUNTING_SITE_TAGS_V1, "GetCounter", "Return single counter"),
            DocumentationPart.pathParameter("counter_id", "Counter id")
        );

        this.publicApi.documentResource(
            this.valuesResource,
            DocumentationPart.method(
                COUNTING_SITE_TAGS_V1,
                "GetData",
                "Return counter values.  If no year&month specified, current month will be used."
            ),
            DocumentationPart.queryParameter("counter_id", "Counter id"),
            DocumentationPart.queryParameter("domain_name", "Domain name"),
            DocumentationPart.queryParameter("year", "Year"),
            DocumentationPart.queryParameter("month", "Month")
        );

        this.publicApi.documentResource(
            this.csvValuesResource,
            DocumentationPart.method(
                COUNTING_SITE_TAGS_V1,
                "GetDataCSV",
                "Return counter values in CSV. If no year&month specified, current month will be used"
            ),
            DocumentationPart.queryParameter("counter_id", "Counter id"),
            DocumentationPart.queryParameter("domain_name", "Domain name"),
            DocumentationPart.queryParameter("year", "Year"),
            DocumentationPart.queryParameter("month", "Month")
        );
    }

    createResources(publicApi: DigitrafficRestApi): void {
        const apiResource = publicApi.root.addResource("api");
        const csResource = apiResource.addResource("counting-site");
        const versionResource = csResource.addResource("v1");

        this.valuesResource = versionResource.addResource("values");
        this.csvValuesResource = versionResource.addResource("values.csv");
        this.countersResource = versionResource.addResource("counters");
        this.counterResource = this.countersResource.addResource("{counterId}");

        this.userTypesResource = versionResource.addResource("user-types");
        this.domainsResource = versionResource.addResource("domains");
        this.directionsResource = versionResource.addResource("directions");
    }

    createModels(publicApi: DigitrafficRestApi): void {
        this.userTypesResponseModel = publicApi.addJsonModel("UserTypesResponseModel", userTypesProperties);
        this.domainsResponseModel = publicApi.addJsonModel("DomainsResponseModel", domainsProperties);
        this.directionsResponseModel = publicApi.addJsonModel("DirectionsResponseModel", directionProperties);
        this.jsonValuesResponseModel = publicApi.addJsonModel("JsonDataResponseModel", dataProperties);

        const counterModel = publicApi.addJsonModel("CounterModel", counterProperties);
        const featureModel = publicApi.addJsonModel(
            "CounterFeatureModel",
            featureSchema(getModelReference(counterModel.modelId, publicApi.restApiId))
        );
        this.geoJsonResponseModel = publicApi.addJsonModel(
            "CountersModel",
            geojsonSchema(getModelReference(featureModel.modelId, publicApi.restApiId))
        );

        this.csvValuesResponseModel = publicApi.addCSVModel("CSVDataModel");
    }

    createUserTypesEndpoint(stack: DigitrafficStack): void {
        const lambda = MonitoredDBFunction.create(stack, "get-user-types");

        const integration = new DigitrafficIntegration(lambda, MediaType.APPLICATION_JSON).build();

        ["GET", "HEAD"].forEach((httpMethod) => {
            this.userTypesResource.addMethod(httpMethod, integration, {
                apiKeyRequired: true,
                methodResponses: [
                    DigitrafficMethodResponse.response200(this.userTypesResponseModel),
                    DigitrafficMethodResponse.response500()
                ]
            });
        });
    }

    createDomainsEndpoint(stack: DigitrafficStack): void {
        const lambda = MonitoredDBFunction.create(stack, "get-domains");

        const integration = new DigitrafficIntegration(lambda, MediaType.APPLICATION_JSON).build();

        ["GET", "HEAD"].forEach((httpMethod) => {
            this.domainsResource.addMethod(httpMethod, integration, {
                apiKeyRequired: true,
                methodResponses: [
                    DigitrafficMethodResponse.response200(this.domainsResponseModel),
                    DigitrafficMethodResponse.response500()
                ]
            });
        });
    }

    createCountersEndpoint(stack: DigitrafficStack): void {
        const lambda = MonitoredDBFunction.create(stack, "get-counters");

        const integration = new DigitrafficIntegration(lambda, MediaType.APPLICATION_GEOJSON)
            .addQueryParameter("domain_name")
            .build();

        ["GET", "HEAD"].forEach((httpMethod) => {
            this.countersResource.addMethod(httpMethod, integration, {
                apiKeyRequired: true,
                requestParameters: {
                    "method.request.querystring.domain_name": false
                },
                methodResponses: [
                    DigitrafficMethodResponse.response200(
                        this.geoJsonResponseModel,
                        MediaType.APPLICATION_GEOJSON
                    ),
                    DigitrafficMethodResponse.response500()
                ]
            });
        });
    }

    createCounterEndpoint(stack: DigitrafficStack): void {
        const lambda = MonitoredDBFunction.create(stack, "get-counter");

        const integration = new DigitrafficIntegration(lambda, MediaType.APPLICATION_GEOJSON)
            .addPathParameter("counterId")
            .build();

        ["GET", "HEAD"].forEach((httpMethod) => {
            this.counterResource.addMethod(httpMethod, integration, {
                apiKeyRequired: true,
                requestParameters: {
                    "method.request.path.counterId": true
                },
                methodResponses: [
                    DigitrafficMethodResponse.response200(
                        this.geoJsonResponseModel,
                        MediaType.APPLICATION_GEOJSON
                    ),
                    DigitrafficMethodResponse.response500()
                ]
            });
        });
    }

    createValuesEndpoint(stack: DigitrafficStack): void {
        const lambda = MonitoredDBFunction.create(stack, "get-values");

        const integration = new DigitrafficIntegration(lambda, MediaType.APPLICATION_JSON)
            .addQueryParameter("counter_id", "domain_name", "year", "month")
            .build();

        ["GET", "HEAD"].forEach((httpMethod) => {
            this.valuesResource.addMethod(httpMethod, integration, {
                apiKeyRequired: true,
                requestParameters: {
                    "method.request.querystring.counter_id": false,
                    "method.request.querystring.domain_name": false,
                    "method.request.querystring.year": false,
                    "method.request.querystring.month": false
                },
                methodResponses: [
                    DigitrafficMethodResponse.response200(this.jsonValuesResponseModel),
                    DigitrafficMethodResponse.response500()
                ]
            });
        });
    }

    createCsvValuesEndpoint(stack: DigitrafficStack): void {
        const lambda = MonitoredDBFunction.create(stack, "get-values-csv", undefined, {
            memorySize: 256
        });

        const integration = new DigitrafficIntegration(lambda, MediaType.APPLICATION_JSON)
            .addQueryParameter("counter_id", "domain_name", "year", "month")
            .build();

        ["GET", "HEAD"].forEach((httpMethod) => {
            this.csvValuesResource.addMethod(httpMethod, integration, {
                apiKeyRequired: true,
                requestParameters: {
                    "method.request.querystring.year": false,
                    "method.request.querystring.month": false,
                    "method.request.querystring.domain_name": false,
                    "method.request.querystring.counter_id": false
                },
                methodResponses: [
                    DigitrafficMethodResponse.response200(this.csvValuesResponseModel, MediaType.TEXT_CSV),
                    DigitrafficMethodResponse.response500()
                ]
            });
        });
    }

    createDirectionsEndpoint(): void {
        DigitrafficStaticIntegration.json(this.directionsResource, {
            1: "In",
            2: "Out",
            3: "No directions"
        });
    }
}
