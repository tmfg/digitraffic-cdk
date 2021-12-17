import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {DigitrafficRestApi} from "digitraffic-common/api/rest_apis";
import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {MessageModel} from "digitraffic-common/api/response";
import {Model, Resource} from "aws-cdk-lib/aws-apigateway";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {DigitrafficLogSubscriptions} from "digitraffic-common/stack/subscription";
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/api/responses";
import {MediaType} from "digitraffic-common/api/mediatypes";
import {featureSchema, geojsonSchema} from "digitraffic-common/model/geojson";
import {addServiceModel, getModelReference} from "digitraffic-common/api/utils";
import nauticalWarningProperties from "./model/nautical-warnings-schema";
import {addTags} from "digitraffic-common/api/documentation";
import {BETA_TAGS} from "digitraffic-common/api/tags";

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

        addTags('GetActiveNauticalWarnings', BETA_TAGS, this.activeResource, stack);
        addTags('GetArchivedNauticalWarnings', BETA_TAGS, this.archivedResource, stack);
    }
}
