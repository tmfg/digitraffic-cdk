import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {DigitrafficRestApi} from "digitraffic-common/aws/infra/stack/rest_apis";
import {Model, Resource} from "aws-cdk-lib/aws-apigateway";
import {MonitoredDBFunction} from "digitraffic-common/aws/infra/stack/monitoredfunction";
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/aws/infra/api/responses";
import {MediaType} from "digitraffic-common/aws/types/mediatypes";
import {
    addTagsAndSummary,
    DocumentationPart,
} from "digitraffic-common/aws/infra/documentation";
import {DigitrafficIntegrationResponse} from "digitraffic-common/aws/runtime/digitraffic-integration-response";
import {directionProperties, domainsProperties, userTypesProperties} from "./model/metadata";
import {dataProperties} from "./model/data";
import {featureSchema, geojsonSchema, getModelReference} from "digitraffic-common/utils/api-model";
import {counterProperties} from "./model/counter";
import {DigitrafficStaticIntegration} from "digitraffic-common/aws/infra/api/static-integration";

const COUNTERS_TAGS = ["Counters(Beta)"];

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
        this.publicApi = new DigitrafficRestApi(stack, 'CountingSites-public', 'Counting Sites Public API');
        this.publicApi.createUsagePlan('CS Api Key', 'CS Usage Plan');

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

    createDocumentation() {
        this.publicApi.documentResource(this.userTypesResource, DocumentationPart.method(COUNTERS_TAGS, 'GetUserTypes', 'Return all user types'));
        this.publicApi.documentResource(this.domainsResource, DocumentationPart.method(COUNTERS_TAGS, 'GetDomains', 'Return all domains'));
        this.publicApi.documentResource(this.directionsResource, DocumentationPart.method(COUNTERS_TAGS, 'GetDirections', 'Return all directions'));

        this.publicApi.documentResource(this.countersResource,
            DocumentationPart.method(COUNTERS_TAGS, 'GetCounters', 'Return all counters for domain'),
            DocumentationPart.queryParameter('domainName', 'Domain name'));

        this.publicApi.documentResource(this.counterResource,
            DocumentationPart.method(COUNTERS_TAGS, 'GetCounter', 'Return single counter'),
            DocumentationPart.pathParameter('counterId', 'Counter id'));

        this.publicApi.documentResource(this.valuesResource,
            DocumentationPart.method(COUNTERS_TAGS, 'GetData', 'Return counter values'),
            DocumentationPart.queryParameter('counterId', 'Counter id'),
            DocumentationPart.queryParameter('domainName', 'Domain name'));

        this.publicApi.documentResource(
            this.csvValuesResource,
            DocumentationPart.method(COUNTERS_TAGS, 'GetDataCSV', 'Return counter values in CSV'),
            DocumentationPart.queryParameter('counterId', 'Counter id'),
            DocumentationPart.queryParameter('domainName', 'Domain name'),
            DocumentationPart.queryParameter('year', 'Year'),
            DocumentationPart.queryParameter('month', 'Month'),
        );
    }

    createResources(publicApi: DigitrafficRestApi) {
        const apiResource = publicApi.root.addResource("api");
        const csResource = apiResource.addResource("counting-site");
        const betaResource = csResource.addResource("beta");

        this.valuesResource = betaResource.addResource("values");
        this.csvValuesResource = betaResource.addResource("csv-values");
        this.countersResource = betaResource.addResource("counters");
        this.counterResource = this.countersResource.addResource("{counterId}");

        this.userTypesResource = betaResource.addResource("user-types");
        this.domainsResource = betaResource.addResource("domains");
        this.directionsResource = betaResource.addResource("directions");
    }

    createModels(publicApi: DigitrafficRestApi) {
        this.userTypesResponseModel = publicApi.addJsonModel('UserTypesResponseModel', userTypesProperties);
        this.domainsResponseModel = publicApi.addJsonModel('DomainsResponseModel', domainsProperties);
        this.directionsResponseModel = publicApi.addJsonModel("DirectionsResponseModel", directionProperties);
        this.jsonValuesResponseModel = publicApi.addJsonModel('JsonDataResponseModel', dataProperties);

        const counterModel = publicApi.addJsonModel("CounterModel", counterProperties);
        const featureModel = publicApi.addJsonModel("CounterFeatureModel", featureSchema(getModelReference(counterModel.modelId, publicApi.restApiId)));
        this.geoJsonResponseModel = publicApi.addJsonModel("CountersModel", geojsonSchema(getModelReference(featureModel.modelId, publicApi.restApiId)));

        this.csvValuesResponseModel = publicApi.addCSVModel("CSVDataModel");
    }

    createUserTypesEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-user-types');

        const integration = defaultIntegration(lambda);

        ['GET', 'HEAD'].forEach((httpMethod) => {
            this.userTypesResource.addMethod(httpMethod, integration, {
                apiKeyRequired: true,
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, this.userTypesResponseModel)),
                    corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, Model.EMPTY_MODEL)),
                ],
            });
        });
    }

    createDomainsEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-domains');

        const integration = defaultIntegration(lambda);

        ['GET', 'HEAD'].forEach((httpMethod) => {
            this.domainsResource.addMethod(httpMethod, integration, {
                apiKeyRequired: true,
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, this.domainsResponseModel)),
                    corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, Model.EMPTY_MODEL)),
                ],
            });
        });
    }

    createCountersEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-counters');

        const integration = defaultIntegration(lambda, {
            requestParameters: {
                'integration.request.path.domainName': 'method.request.path.domainName',
            },
            requestTemplates: {
                'application/json': JSON.stringify({domainName: "$util.escapeJavaScript($input.params('domainName'))"}),
            },
            responses: [DigitrafficIntegrationResponse.ok(MediaType.APPLICATION_GEOJSON)],
        });

        ['GET', 'HEAD'].forEach((httpMethod) => {
            this.countersResource.addMethod(httpMethod, integration, {
                apiKeyRequired: true,
                requestParameters: {
                    'method.request.path.domainName': false,
                },
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.APPLICATION_GEOJSON, this.geoJsonResponseModel)),
                    corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, Model.EMPTY_MODEL)),
                ],
            });
        });
    }

    createCounterEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-counter');

        const integration = defaultIntegration(lambda, {
            requestParameters: {
                'integration.request.path.counterId': 'method.request.path.counterId',
            },
            requestTemplates: {
                'application/json': JSON.stringify({counterId: "$util.escapeJavaScript($input.params('counterId'))"}),
            },
            responses: [DigitrafficIntegrationResponse.ok(MediaType.APPLICATION_GEOJSON)],
        });

        ['GET', 'HEAD'].forEach((httpMethod) => {
            this.counterResource.addMethod(httpMethod, integration, {
                apiKeyRequired: true,
                requestParameters: {
                    'method.request.path.counterId': true,
                },
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.APPLICATION_GEOJSON, this.geoJsonResponseModel)),
                    corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, Model.EMPTY_MODEL)),
                ],
            });
        });
    }

    createValuesEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-data');

        const integration = defaultIntegration(lambda, {
            requestParameters: {
                'integration.request.querystring.counterId': 'method.request.querystring.counterId',
                'integration.request.querystring.domainName': 'method.request.querystring.domainName',
            },
            requestTemplates: {
                'application/json': JSON.stringify({
                    counterId: "$util.escapeJavaScript($input.params('counterId'))",
                    domainName: "$util.escapeJavaScript($input.params('domainName'))",
                }),
            },
            responses: [
                DigitrafficIntegrationResponse.ok(MediaType.APPLICATION_JSON),
                DigitrafficIntegrationResponse.badRequest(),
            ],
        });

        ['GET', 'HEAD'].forEach((httpMethod) => {
            this.valuesResource.addMethod(httpMethod, integration, {
                apiKeyRequired: true,
                requestParameters: {
                    'method.request.path.counterId': false,
                    'method.request.path.domainName': false,
                },
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, this.jsonValuesResponseModel)),
                    corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, Model.EMPTY_MODEL)),
                ],
            });
        });
    }

    createCsvValuesEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-data-csv', undefined, {
            memorySize: 256,
        });

        const integration = defaultIntegration(lambda, {
            requestParameters: {
                'integration.request.querystring.year': 'method.request.querystring.year',
                'integration.request.querystring.month': 'method.request.querystring.month',
                'integration.request.querystring.domainName': 'method.request.querystring.domainName',
                'integration.request.querystring.counterId': 'method.request.querystring.counterId',
            },
            requestTemplates: {
                'application/json': JSON.stringify({
                    year: "$util.escapeJavaScript($input.params('year'))",
                    month: "$util.escapeJavaScript($input.params('month'))",
                    domainName: "$util.escapeJavaScript($input.params('domainName'))",
                    counterId: "$util.escapeJavaScript($input.params('counterId'))",
                }),
            },
            responses: [
                DigitrafficIntegrationResponse.ok(MediaType.APPLICATION_JSON),
                DigitrafficIntegrationResponse.badRequest(),
            ],
        });

        ['GET', 'HEAD'].forEach((httpMethod) => {
            this.csvValuesResource.addMethod(httpMethod, integration, {
                apiKeyRequired: true,
                requestParameters: {
                    'method.request.querystring.year': false,
                    'method.request.querystring.month': false,
                    'method.request.querystring.domainName': false,
                    'method.request.querystring.counterId': false,
                },
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.TEXT_CSV, this.csvValuesResponseModel)),
                    corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, Model.EMPTY_MODEL)),
                ],
            });
        });
    }

    createDirectionsEndpoint() {
        DigitrafficStaticIntegration.json(this.directionsResource, {
            1: "In",
            2: "Out",
            3: "No directions",
        });
    }
}
