import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {DigitrafficRestApi} from "digitraffic-common/aws/infra/stack/rest_apis";
import {Model, Resource} from "aws-cdk-lib/aws-apigateway";
import {MonitoredDBFunction} from "digitraffic-common/aws/infra/stack/monitoredfunction";
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/aws/infra/api/responses";
import {MediaType} from "digitraffic-common/aws/types/mediatypes";
import {addQueryParameterDescription, addTagsAndSummary} from "digitraffic-common/aws/infra/documentation";
import {DigitrafficIntegrationResponse} from "digitraffic-common/aws/runtime/digitraffic-integration-response";
import {metadataProperties} from "./model/metadata";
import {dataProperties} from "./model/data";
import {featureSchema, geojsonSchema, getModelReference} from "digitraffic-common/utils/api-model";
import {counterProperties} from "./model/counter";

const COUNTERS_TAGS = ["Counters(Beta)"];

export class PublicApi {
    publicApi: DigitrafficRestApi;
    metadataResource: Resource;
    countersListResource: Resource;
    dataResource: Resource;
    dataCsvResource: Resource;

    metadataResponseModel: Model;
    jsonDataResponseModel: Model;
    geoJsonResponseModel: Model;
    csvDataResponseModel: Model;

    constructor(stack: DigitrafficStack) {
        this.publicApi = new DigitrafficRestApi(stack, 'CountingSites-public', 'Counting Sites Public API');
        this.publicApi.createUsagePlan('CS Api Key', 'CS Usage Plan');

        this.createResources(this.publicApi);
        this.createModels(this.publicApi);

        this.createMetadataEndpoint(stack);
        this.createDataEndpoint(stack);
        this.createDataCsvEndpoint(stack);
        this.createCountersEndpoint(stack);

        this.createDocumentation(stack);
    }

    createDocumentation(stack: DigitrafficStack) {
        addTagsAndSummary(
            'GetMetadata', COUNTERS_TAGS, 'Return all metadata', this.metadataResource, stack,
        );

        addTagsAndSummary(
            'GetCounters', COUNTERS_TAGS, 'Return all counters for domain', this.countersListResource, stack,
        );
        addQueryParameterDescription('domain', 'Domain', this.countersListResource, stack);

        addTagsAndSummary(
            'GetData', COUNTERS_TAGS, 'Return all data', this.dataResource, stack,
        );

        addTagsAndSummary(
            'GetData as CSV', COUNTERS_TAGS, 'Return all data in CSV', this.dataCsvResource, stack,
        );

        addQueryParameterDescription('id', 'Site-id', this.dataResource, stack);
    }

    createResources(publicApi: DigitrafficRestApi) {
        const apiResource = publicApi.root.addResource("api");
        const csResource = apiResource.addResource("counters");
        const betaResource = csResource.addResource("beta");
        const valuesResource = betaResource.addResource("values");
        const csvValuesResource = betaResource.addResource("csv-values");
        const monthResource = csvValuesResource.addResource("{year}");
        const countersResource = betaResource.addResource("counters");

        this.metadataResource = betaResource.addResource("metadata");
        this.dataResource = valuesResource.addResource("{counterId}");
        this.dataCsvResource = monthResource.addResource("{month}");
        this.countersListResource = countersResource.addResource("{domainName}");
    }

    createModels(publicApi: DigitrafficRestApi) {
        this.metadataResponseModel = publicApi.addJsonModel('MetadataResponseModel', metadataProperties);
        this.jsonDataResponseModel = publicApi.addJsonModel('JsonDataResponseModel', dataProperties);

        const counterModel = publicApi.addJsonModel("CounterModel", counterProperties);
        const featureModel = publicApi.addJsonModel("CounterFeatureModel", featureSchema(getModelReference(counterModel.modelId, publicApi.restApiId)));
        this.geoJsonResponseModel = publicApi.addJsonModel("CountersModel", geojsonSchema(getModelReference(featureModel.modelId, publicApi.restApiId)));

        this.csvDataResponseModel = publicApi.addCSVModel("CSVDataModel");
    }

    createMetadataEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-metadata');

        const metadataIntegration = defaultIntegration(lambda);

        ['GET', 'HEAD'].forEach((httpMethod) => {
            this.metadataResource.addMethod(httpMethod, metadataIntegration, {
                apiKeyRequired: true,
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, this.metadataResponseModel)),
                    corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, Model.EMPTY_MODEL)),
                ],
            });
        });
    }

    createCountersEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-counters');

        const countersIntegration = defaultIntegration(lambda, {
            requestParameters: {
                'integration.request.path.domainName': 'method.request.path.domainName',
            },
            requestTemplates: {
                'application/json': JSON.stringify({domainName: "$util.escapeJavaScript($input.params('domainName'))"}),
            },
            responses: [DigitrafficIntegrationResponse.ok(MediaType.APPLICATION_GEOJSON)],
        });

        ['GET', 'HEAD'].forEach((httpMethod) => {
            this.countersListResource.addMethod(httpMethod, countersIntegration, {
                apiKeyRequired: true,
                requestParameters: {
                    'method.request.path.domainName': true,
                },
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.APPLICATION_GEOJSON, this.geoJsonResponseModel)),
                    corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, Model.EMPTY_MODEL)),
                ],
            });
        });
    }

    createDataEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-data');

        const dataIntegration = defaultIntegration(lambda, {
            requestParameters: {
                'integration.request.path.counterId': 'method.request.path.counterId',
            },
            requestTemplates: {
                'application/json': JSON.stringify({counterId: "$util.escapeJavaScript($input.params('counterId'))"}),
            },
            responses: [DigitrafficIntegrationResponse.ok(MediaType.APPLICATION_JSON)],
        });

        ['GET', 'HEAD'].forEach((httpMethod) => {
            this.dataResource.addMethod(httpMethod, dataIntegration, {
                apiKeyRequired: true,
                requestParameters: {
                    'method.request.path.counterId': true,
                },
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, this.jsonDataResponseModel)),
                    corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, Model.EMPTY_MODEL)),
                ],
            });
        });
    }

    createDataCsvEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-data-csv', undefined, {
            memorySize: 256,
        });

        const dataIntegration = defaultIntegration(lambda, {
            requestParameters: {
                'integration.request.path.year': 'method.request.path.year',
                'integration.request.path.month': 'method.request.path.month',
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
            responses: [DigitrafficIntegrationResponse.ok(MediaType.APPLICATION_JSON)],
        });

        ['GET', 'HEAD'].forEach((httpMethod) => {
            this.dataCsvResource.addMethod(httpMethod, dataIntegration, {
                apiKeyRequired: true,
                requestParameters: {
                    'method.request.path.year': true,
                    'method.request.path.month': true,
                    'method.request.querystring.domainName': false,
                    'method.request.querystring.counterId': false,
                },
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.TEXT_CSV, this.csvDataResponseModel)),
                    corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, Model.EMPTY_MODEL)),
                ],
            });
        });
    }
}
