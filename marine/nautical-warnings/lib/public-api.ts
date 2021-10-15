import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {DigitrafficRestApi} from "digitraffic-common/api/rest_apis";
import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {MessageModel} from "digitraffic-common/api/response";
import {Model, Resource} from "@aws-cdk/aws-apigateway";
import {dbFunctionProps} from "digitraffic-common/stack/lambda-configs";
import {AssetCode} from "@aws-cdk/aws-lambda";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {TrafficType} from "digitraffic-common/model/traffictype";
import {createSubscription} from "digitraffic-common/stack/subscription";
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/api/responses";
import {MediaType} from "digitraffic-common/api/mediatypes";
import {featureSchema, geojsonSchema} from "digitraffic-common/model/geojson";
import {addServiceModel, getModelReference} from "digitraffic-common/api/utils";
import nauticalWarningProperties from "./model/nautical-warnings-schema";

export class PublicApi {
    readonly apiKeyId: string;
    readonly publicApi: DigitrafficRestApi;
    activeResource: Resource;
    archivedResource: Resource;
    geojsonModel: Model;
    errorModel: Model;

    constructor(stack: DigitrafficStack, secret: ISecret) {
        this.publicApi = new DigitrafficRestApi(stack, 'NauticalWarnings-public', 'NauticalWarnings Public API');
        this.apiKeyId = createUsagePlan(this.publicApi, 'NauticalWarnings Api Key', 'NauticalWarnings Usage Plan').keyId;

        this.createResources(this.publicApi);
        this.createEndpoint(stack, secret);
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

    createEndpoint(stack: DigitrafficStack, secret: ISecret) {
        const environment = stack.createDefaultLambdaEnvironment('NauticalWarnings');
        const functionNameActive = 'NauticalWarnings-GetActive';
        const functionNameArchived = 'NauticalWarnings-GetArchived';

        const lambdaConfActive = dbFunctionProps(stack, {
            environment,
            functionName: functionNameActive,
            code: new AssetCode('dist/lambda/get-warnings'),
            handler: 'get-active.handler',
        });
        const lambdaConfArchived = dbFunctionProps(stack, {
            environment,
            functionName: functionNameArchived,
            code: new AssetCode('dist/lambda/get-warnings'),
            handler: 'get-archived.handler',
        });

        const lambdaActive = MonitoredFunction.create(stack, 'active-lambda', lambdaConfActive, TrafficType.MARINE);
        const lambdaArchived = MonitoredFunction.create(stack, 'archive-lambda', lambdaConfArchived, TrafficType.MARINE);
        secret.grantRead(lambdaActive);
        secret.grantRead(lambdaArchived);

        createSubscription(lambdaActive, functionNameActive, stack.configuration.logsDestinationArn, stack);
        createSubscription(lambdaArchived, functionNameArchived, stack.configuration.logsDestinationArn, stack);

        const activeIntegration = defaultIntegration(lambdaActive);
        const archivedIntegration = defaultIntegration(lambdaArchived);

        this.activeResource.addMethod("GET", activeIntegration, {
            apiKeyRequired: false,
            methodResponses: [
                corsMethod(methodResponse("200", MediaType.APPLICATION_GEOJSON, this.geojsonModel)),
                corsMethod(methodResponse("500", MediaType.TEXT_PLAIN, this.geojsonModel))
            ]
        });

        this.archivedResource.addMethod("GET", archivedIntegration, {
            apiKeyRequired: false,
            methodResponses: [
                corsMethod(methodResponse("200", MediaType.APPLICATION_GEOJSON, this.geojsonModel)),
                corsMethod(methodResponse("500", MediaType.TEXT_PLAIN, this.geojsonModel))
            ]
        });

    }
}
