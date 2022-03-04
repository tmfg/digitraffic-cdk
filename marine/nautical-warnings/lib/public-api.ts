import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {DigitrafficRestApi} from "digitraffic-common/aws/infra/stack/rest_apis";
import {createUsagePlan} from "digitraffic-common/aws/infra/usage-plans";
import {MessageModel} from "digitraffic-common/aws/infra/api/response";
import {Model, Resource} from "aws-cdk-lib/aws-apigateway";
import {MonitoredFunction} from "digitraffic-common/aws/infra/stack/monitoredfunction";
import {DigitrafficLogSubscriptions} from "digitraffic-common/aws/infra/stack/subscription";
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/aws/infra/api/responses";
import {MediaType} from "digitraffic-common/aws/types/mediatypes";
import {addServiceModel, featureSchema, geojsonSchema, getModelReference} from "digitraffic-common/utils/api-model";
import nauticalWarningProperties from "./model/nautical-warnings-schema";
import {DocumentationPart} from "digitraffic-common/aws/infra/documentation";

const NAUTICAL_WARNINGS_TAGS = ['Nautical Warnings(Beta)'];

export class PublicApi {
    readonly apiKeyId: string;
    readonly publicApi: DigitrafficRestApi;
    activeResource: Resource;
    archivedResource: Resource;
    geojsonModel: Model;
    errorModel: Model;

    constructor(stack: DigitrafficStack) {
        this.publicApi = new DigitrafficRestApi(stack, 'NauticalWarnings-public', 'NauticalWarnings Public API');
        this.apiKeyId = createUsagePlan(this.publicApi, 'NauticalWarnings Api Key', 'NauticalWarnings Usage Plan').keyId;

        this.createResources(this.publicApi);
        this.createEndpoint(stack);
    }

    createResources(publicApi: DigitrafficRestApi) {
        const apiResource = publicApi.root.addResource("api");
        const csResource = apiResource.addResource("nautical-warnings");
        const betaResource = csResource.addResource("beta");
        this.activeResource = betaResource.addResource("active");
        this.archivedResource = betaResource.addResource("archived");

        const warningModel = addServiceModel('WarningModel', publicApi, nauticalWarningProperties);
        const featureModel = addServiceModel("FeatureModel", publicApi, featureSchema(getModelReference(warningModel.modelId, publicApi.restApiId)));
        this.geojsonModel = addServiceModel('GeoJSONResponseModel', publicApi, geojsonSchema(getModelReference(featureModel.modelId, publicApi.restApiId)));
        this.errorModel = publicApi.addModel('ErrorResponseModel', MessageModel);
    }

    createEndpoint(stack: DigitrafficStack) {
        const environment = stack.createLambdaEnvironment();

        const lambdaActive = MonitoredFunction.createV2(stack, 'get-active', environment);
        const lambdaArchived = MonitoredFunction.createV2(stack, 'get-archived', environment);

        stack.grantSecret(lambdaActive, lambdaArchived);
        new DigitrafficLogSubscriptions(stack, lambdaActive, lambdaArchived);

        const activeIntegration = defaultIntegration(lambdaActive);
        const archivedIntegration = defaultIntegration(lambdaArchived);

        this.activeResource.addMethod("GET", activeIntegration, {
            apiKeyRequired: false,
            methodResponses: [
                corsMethod(methodResponse("200", MediaType.APPLICATION_GEOJSON, this.geojsonModel)),
                corsMethod(methodResponse("500", MediaType.TEXT_PLAIN, this.geojsonModel)),
            ],
        });

        this.archivedResource.addMethod("GET", archivedIntegration, {
            apiKeyRequired: false,
            methodResponses: [
                corsMethod(methodResponse("200", MediaType.APPLICATION_GEOJSON, this.geojsonModel)),
                corsMethod(methodResponse("500", MediaType.TEXT_PLAIN, this.geojsonModel)),
            ],
        });

        this.publicApi.documentResource(this.activeResource, DocumentationPart.method(NAUTICAL_WARNINGS_TAGS, 'GetActiveNauticalWarnings', 'Return all active nautical warnings'));
        this.publicApi.documentResource(this.archivedResource, DocumentationPart.method(NAUTICAL_WARNINGS_TAGS, 'GetArchivedNauticalWarnings',  'Return all archived nautical warnings'));
    }
}
