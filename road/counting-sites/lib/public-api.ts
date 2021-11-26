import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {DigitrafficRestApi} from "digitraffic-common/api/rest_apis";
import {Model, Resource} from "@aws-cdk/aws-apigateway";
import {MonitoredDBFunction} from "digitraffic-common/lambda/monitoredfunction";
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/api/responses";
import {MediaType} from "digitraffic-common/api/mediatypes";
import {MessageModel} from "digitraffic-common/api/response";
import {BETA_TAGS} from "digitraffic-common/api/tags";
import {addQueryParameterDescription, addTagsAndSummary} from "digitraffic-common/api/documentation";
import {DigitrafficIntegrationResponse} from "digitraffic-common/api/digitraffic-integration-response";

export class PublicApi {
    publicApi: DigitrafficRestApi;
    metadataResource: Resource;
    countersListResource: Resource;
    dataResource: Resource;

    errorResponseModel: Model;
    metadataResponseModel: Model;
    dataResponseModel: Model;

    constructor(stack: DigitrafficStack) {
        this.publicApi = new DigitrafficRestApi(stack, 'CountingSites-public', 'Counting Sites Public API');
        this.publicApi.createUsagePlan('CS Api Key', 'CS Usage Plan');

        this.createResources(this.publicApi);

        this.createMetadataEndpoint(stack);
        this.createDataEndpoint(stack);
        this.createCountersEndpoint(stack);

        this.createDocumentation(stack);
    }

    createDocumentation(stack: DigitrafficStack) {
        addTagsAndSummary('GetMetadata', BETA_TAGS, 'Return all metadata', this.metadataResource, stack);

        addTagsAndSummary('GetCounters', BETA_TAGS, 'Return all counters for domain', this.countersListResource, stack);
        addQueryParameterDescription('domain', 'Domain', this.countersListResource, stack);

        addTagsAndSummary('GetData', BETA_TAGS, 'Return all data', this.dataResource, stack);
        addQueryParameterDescription('id', 'Site-id', this.dataResource, stack);
    }

    createResources(publicApi: DigitrafficRestApi) {
        const apiResource = publicApi.root.addResource("api");
        const csResource = apiResource.addResource("counters");
        const betaResource = csResource.addResource("beta");
        const valuesResource = betaResource.addResource("values");
        const countersResource = betaResource.addResource("counters");

        this.metadataResource = betaResource.addResource("metadata");
        this.dataResource = valuesResource.addResource("{id}");
        this.countersListResource = countersResource.addResource("{domain}");

//        this.errorResponseModel = publicApi.addModel('ErrorResponseModel', MessageModel);
        this.metadataResponseModel = publicApi.addModel('MetadataResponseModel', MessageModel);
//        this.dataResponseModel = publicApi.addModel('DataResponseModel', MessageModel);
    }

    createMetadataEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-metadata');

        const metadataIntegration = defaultIntegration(lambda);

        this.metadataResource.addMethod("GET", metadataIntegration, {
            apiKeyRequired: true,
            methodResponses: [
                corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, this.metadataResponseModel)),
                corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, this.metadataResponseModel))
            ]
        });
    }

    createCountersEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-counters');

        const countersIntegration = defaultIntegration(lambda, {
            requestParameters: {
                'integration.request.path.domain': 'method.request.path.domain'
            },
            requestTemplates: {
                'application/json': JSON.stringify({domain: "$util.escapeJavaScript($input.params('domain'))"})
            },
            responses: [DigitrafficIntegrationResponse.ok(MediaType.APPLICATION_GEOJSON)]
        });

        this.countersListResource.addMethod("GET", countersIntegration, {
            apiKeyRequired: true,
            requestParameters: {
                'method.request.path.domain': true
            },
            methodResponses: [
                corsMethod(methodResponse("200", MediaType.APPLICATION_GEOJSON, this.metadataResponseModel)),
                corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, this.metadataResponseModel))
            ]
        })
    }

    createDataEndpoint(stack: DigitrafficStack) {
        const lambda = MonitoredDBFunction.create(stack, 'get-data');

        const dataIntegration = defaultIntegration(lambda, {
            requestParameters: {
                'integration.request.path.id': 'method.request.path.id'
            },
            requestTemplates: {
                'application/json': JSON.stringify({id: "$util.escapeJavaScript($input.params('id'))"})
            },
            responses: [DigitrafficIntegrationResponse.ok(MediaType.APPLICATION_JSON)]
        });

        this.dataResource.addMethod("GET", dataIntegration, {
            apiKeyRequired: true,
            requestParameters: {
                'method.request.path.id': true
            },
            methodResponses: [
                corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, this.metadataResponseModel)),
                corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, this.metadataResponseModel))
            ]
        });
    }
}
