import {DigitrafficStack} from "@digitraffic/common/aws/infra/stack/stack";
import {DigitrafficRestApi} from "@digitraffic/common/aws/infra/stack/rest_apis";
import {Model, Resource} from "aws-cdk-lib/aws-apigateway";
import {MonitoredDBFunction} from "@digitraffic/common/aws/infra/stack/monitoredfunction";
import {corsMethod, defaultIntegration, methodResponse} from "@digitraffic/common/aws/infra/api/responses";
import {MediaType} from "@digitraffic/common/aws/types/mediatypes";
import {DocumentationPart} from "@digitraffic/common/aws/infra/documentation";
import {DigitrafficIntegrationResponse} from "@digitraffic/common/aws/runtime/digitraffic-integration-response";
import {directionProperties, domainsProperties, userTypesProperties} from "./model/metadata";
import {dataProperties} from "./model/data";
import {featureSchema, geojsonSchema, getModelReference} from "@digitraffic/common/utils/api-model";
import {counterProperties} from "./model/counter";
import {DigitrafficStaticIntegration} from "@digitraffic/common/aws/infra/api/static-integration";

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
        this.publicApi = new DigitrafficRestApi(stack, 'CountingSite-public', 'Counting Site Public API');
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
        this.publicApi.documentResource(this.userTypesResource, DocumentationPart.method(COUNTING_SITE_TAGS_V1, 'GetUserTypes', 'Return all user types'));
        this.publicApi.documentResource(this.domainsResource, DocumentationPart.method(COUNTING_SITE_TAGS_V1, 'GetDomains', 'Return all domains'));
        this.publicApi.documentResource(this.directionsResource, DocumentationPart.method(COUNTING_SITE_TAGS_V1, 'GetDirections', 'Return all directions'));

        this.publicApi.documentResource(this.countersResource,
            DocumentationPart.method(COUNTING_SITE_TAGS_V1, 'GetCounters', 'Return all counters for domain'),
            DocumentationPart.queryParameter('domain_name', 'Domain name'));

        this.publicApi.documentResource(this.counterResource,
            DocumentationPart.method(COUNTING_SITE_TAGS_V1, 'GetCounter', 'Return single counter'),
            DocumentationPart.pathParameter('counter_id', 'Counter id'));

        this.publicApi.documentResource(
            this.valuesResource,
            DocumentationPart.method(COUNTING_SITE_TAGS_V1, 'GetData', 'Return counter values.  If no year&month specified, current month will be used.'),
            DocumentationPart.queryParameter('counter_id', 'Counter id'),
            DocumentationPart.queryParameter('domain_name', 'Domain name'),
            DocumentationPart.queryParameter('year', 'Year'),
            DocumentationPart.queryParameter('month', 'Month'),
        );

        this.publicApi.documentResource(
            this.csvValuesResource,
            DocumentationPart.method(COUNTING_SITE_TAGS_V1, 'GetDataCSV', 'Return counter values in CSV. If no year&month specified, current month will be used'),
            DocumentationPart.queryParameter('counter_id', 'Counter id'),
            DocumentationPart.queryParameter('domain_name', 'Domain name'),
            DocumentationPart.queryParameter('year', 'Year'),
            DocumentationPart.queryParameter('month', 'Month'),
        );
    }

    createResources(publicApi: DigitrafficRestApi) {
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
                'integration.request.querystring.domain_name': 'method.request.querystring.domain_name',
            },
            requestTemplates: {
                'application/json': JSON.stringify({domainName: "$util.escapeJavaScript($input.params('domain_name'))"}),
            },
            responses: [DigitrafficIntegrationResponse.ok(MediaType.APPLICATION_GEOJSON)],
        });

        ['GET', 'HEAD'].forEach((httpMethod) => {
            this.countersResource.addMethod(httpMethod, integration, {
                apiKeyRequired: true,
                requestParameters: {
                    'method.request.querystring.domain_name': false,
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
        const lambda = MonitoredDBFunction.create(stack, 'get-values');

        const integration = defaultIntegration(lambda, {
            requestParameters: {
                'integration.request.querystring.counter_id': 'method.request.querystring.counter_id',
                'integration.request.querystring.domain_name': 'method.request.querystring.domain_name',
                'integration.request.querystring.year': 'method.request.querystring.year',
                'integration.request.querystring.month': 'method.request.querystring.month',
            },
            requestTemplates: {
                'application/json': JSON.stringify({
                    counterId: "$util.escapeJavaScript($input.params('counter_id'))",
                    domainName: "$util.escapeJavaScript($input.params('domain_name'))",
                    year: "$util.escapeJavaScript($input.params('year'))",
                    month: "$util.escapeJavaScript($input.params('month'))",
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
                    'method.request.querystring.counter_id': false,
                    'method.request.querystring.domain_name': false,
                    'method.request.querystring.year': false,
                    'method.request.querystring.month': false,
                },
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, this.jsonValuesResponseModel)),
                    corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, Model.EMPTY_MODEL)),
                ],
            });
        });
    }

    createCsvValuesEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-values-csv', undefined, {
            memorySize: 256,
        });

        const integration = defaultIntegration(lambda, {
            requestParameters: {
                'integration.request.querystring.year': 'method.request.querystring.year',
                'integration.request.querystring.month': 'method.request.querystring.month',
                'integration.request.querystring.domain_name': 'method.request.querystring.domain_name',
                'integration.request.querystring.counter_id': 'method.request.querystring.counter_id',
            },
            requestTemplates: {
                'application/json': JSON.stringify({
                    year: "$util.escapeJavaScript($input.params('year'))",
                    month: "$util.escapeJavaScript($input.params('month'))",
                    domainName: "$util.escapeJavaScript($input.params('domain_name'))",
                    counterId: "$util.escapeJavaScript($input.params('counter_id'))",
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
                    'method.request.querystring.domain_name': false,
                    'method.request.querystring.counter_id': false,
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
