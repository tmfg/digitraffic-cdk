import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {DigitrafficRestApi} from "digitraffic-common/api/rest_apis";
import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {Model, Resource} from "@aws-cdk/aws-apigateway";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/api/responses";
import {MediaType} from "digitraffic-common/api/mediatypes";
import {MessageModel} from "digitraffic-common/api/response";
import {DigitrafficLogSubscriptions} from "digitraffic-common/stack/subscription";
import {BETA_TAGS} from "digitraffic-common/api/tags";
import {addTagsAndSummary} from "digitraffic-common/api/documentation";

export class PublicApi {
    publicApi: DigitrafficRestApi;
    metadataResource: Resource;
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
        this.createDocumentation(stack);
    }

    createDocumentation(stack: DigitrafficStack) {
        addTagsAndSummary('GetMetadata', BETA_TAGS, 'Return all metadata', this.metadataResource, stack);
        addTagsAndSummary('GetData', BETA_TAGS, 'Return all data', this.dataResource, stack);

    }

    createResources(publicApi: DigitrafficRestApi) {
        const apiResource = publicApi.root.addResource("api");
        const csResource = apiResource.addResource("counting-sites");
        const betaResource = csResource.addResource("beta");
        const valuesResource = betaResource.addResource("values");
        this.metadataResource = betaResource.addResource("metadata");
        this.dataResource = valuesResource.addResource("{id}");

//        this.errorResponseModel = publicApi.addModel('ErrorResponseModel', MessageModel);
        this.metadataResponseModel = publicApi.addModel('MetadataResponseModel', MessageModel);
//        this.dataResponseModel = publicApi.addModel('DataResponseModel', MessageModel);
    }

    createMetadataEndpoint(stack: DigitrafficStack) {
        const environment = stack.createLambdaEnvironment();
        const lambda = MonitoredFunction.createV2(stack, 'get-metadata', environment, {
  //          functionName: 'metadata-lambda'
        });

        stack.grantSecret(lambda);
        new DigitrafficLogSubscriptions(stack, lambda);

        const metadataIntegration = defaultIntegration(lambda);

        this.metadataResource.addMethod("GET", metadataIntegration, {
            apiKeyRequired: false,
            methodResponses: [
                corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, this.metadataResponseModel)),
                corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, this.metadataResponseModel))
            ]
        });
    }

    createDataEndpoint(stack: DigitrafficStack) {
        const environment = stack.createLambdaEnvironment();
        const lambda = MonitoredFunction.createV2(stack, 'get-data', environment, {
//            functionName: 'data-lambda'
        });

        stack.grantSecret(lambda);
        new DigitrafficLogSubscriptions(stack, lambda);

        const dataIntegration = defaultIntegration(lambda, {
            requestParameters: {
                'integration.request.path.id': 'method.request.path.id'
            },
            requestTemplates: {
                'application/json': JSON.stringify({id: "$util.escapeJavaScript($input.params('id'))"})
            },
        });

        this.dataResource.addMethod("GET", dataIntegration, {
            apiKeyRequired: false,
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
