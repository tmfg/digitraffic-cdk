import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {DigitrafficRestApi} from "digitraffic-common/api/rest_apis";
import {Model, Resource} from "aws-cdk-lib/aws-apigateway";
import {MonitoredDBFunction} from "digitraffic-common/aws/infra/stack/monitoredfunction";
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/api/responses";
import {MediaType} from "digitraffic-common/aws/types/mediatypes";
import {MessageModel} from "digitraffic-common/api/response";
import {BETA_TAGS} from "digitraffic-common/aws/types/tags";
import {addQueryParameterDescription, addTagsAndSummary} from "digitraffic-common/aws/infra/documentation";
import {DigitrafficIntegrationResponse} from "digitraffic-common/aws/infra/digitraffic-integration-response";

export class PublicApi {
    publicApi: DigitrafficRestApi;
    metadataResource: Resource;
    countersListResource: Resource;
    dataResource: Resource;
    dataCsvResource: Resource;

    errorResponseModel: Model;
    metadataResponseModel: Model;
    dataResponseModel: Model;

    constructor(stack: DigitrafficStack) {
        this.publicApi = new DigitrafficRestApi(stack, 'CountingSites-public', 'Counting Sites Public API');
        this.publicApi.createUsagePlan('CS Api Key', 'CS Usage Plan');

        this.createResources(this.publicApi);

        this.createMetadataEndpoint(stack);
        this.createDataEndpoint(stack);
        this.createDataCsvEndpoint(stack);
        this.createCountersEndpoint(stack);

        this.createDocumentation(stack);
    }

    createDocumentation(stack: DigitrafficStack) {
        addTagsAndSummary(
            'GetMetadata', BETA_TAGS, 'Return all metadata', this.metadataResource, stack,
        );

        addTagsAndSummary(
            'GetCounters', BETA_TAGS, 'Return all counters for domain', this.countersListResource, stack,
        );
        addQueryParameterDescription('domain', 'Domain', this.countersListResource, stack);

        addTagsAndSummary(
            'GetData', BETA_TAGS, 'Return all data', this.dataResource, stack,
        );

        addTagsAndSummary(
            'GetData as CSV', BETA_TAGS, 'Return all data', this.dataCsvResource, stack,
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
        this.dataResource = valuesResource.addResource("{id}");
        this.dataCsvResource = monthResource.addResource("{month}");
        this.countersListResource = countersResource.addResource("{domain}");
        this.metadataResponseModel = publicApi.addModel('MetadataResponseModel', MessageModel);
    }

    createMetadataEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-metadata');

        const metadataIntegration = defaultIntegration(lambda);

        ['GET', 'HEAD'].forEach((httpMethod) => {
            this.metadataResource.addMethod(httpMethod, metadataIntegration, {
                apiKeyRequired: true,
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, this.metadataResponseModel)),
                    corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, this.metadataResponseModel)),
                ],
            });
        });
    }

    createCountersEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-counters');

        const countersIntegration = defaultIntegration(lambda, {
            requestParameters: {
                'integration.request.path.domain': 'method.request.path.domain',
            },
            requestTemplates: {
                'application/json': JSON.stringify({domain: "$util.escapeJavaScript($input.params('domain'))"}),
            },
            responses: [DigitrafficIntegrationResponse.ok(MediaType.APPLICATION_GEOJSON)],
        });

        ['GET', 'HEAD'].forEach((httpMethod) => {
            this.countersListResource.addMethod(httpMethod, countersIntegration, {
                apiKeyRequired: true,
                requestParameters: {
                    'method.request.path.domain': true,
                },
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.APPLICATION_GEOJSON, this.metadataResponseModel)),
                    corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, this.metadataResponseModel)),
                ],
            });
        });
    }

    createDataEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-data');

        const dataIntegration = defaultIntegration(lambda, {
            requestParameters: {
                'integration.request.path.id': 'method.request.path.id',
            },
            requestTemplates: {
                'application/json': JSON.stringify({id: "$util.escapeJavaScript($input.params('id'))"}),
            },
            responses: [DigitrafficIntegrationResponse.ok(MediaType.APPLICATION_JSON)],
        });

        ['GET', 'HEAD'].forEach((httpMethod) => {
            this.dataResource.addMethod(httpMethod, dataIntegration, {
                apiKeyRequired: true,
                requestParameters: {
                    'method.request.path.id': true,
                },
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, this.metadataResponseModel)),
                    corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, this.metadataResponseModel)),
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
            },
            requestTemplates: {
                'application/json': JSON.stringify({
                    year: "$util.escapeJavaScript($input.params('year'))",
                    month: "$util.escapeJavaScript($input.params('month'))",
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
                },
                methodResponses: [
                    corsMethod(methodResponse("200", MediaType.TEXT_CSV, this.metadataResponseModel)),
                    corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, this.metadataResponseModel)),
                ],
            });
        });
    }
}
