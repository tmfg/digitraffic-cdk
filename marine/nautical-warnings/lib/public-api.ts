import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {DigitrafficRestApi} from "digitraffic-common/api/rest_apis";
import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {MessageModel} from "digitraffic-common/api/response";
import {Model, Resource} from "@aws-cdk/aws-apigateway";
import {dbFunctionProps} from "digitraffic-common/stack/lambda-configs";
import {Architecture, AssetCode} from "@aws-cdk/aws-lambda";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {TrafficType} from "digitraffic-common/model/traffictype";
import {createSubscription} from "digitraffic-common/stack/subscription";
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/api/responses";
import {MediaType} from "digitraffic-common/api/mediatypes";

export class PublicApi {
    readonly apiKeyId: string;
    activeResource: Resource;
    archivedResource: Resource;
    activeWarningsModel: Model;

    constructor(stack: DigitrafficStack, secret: ISecret) {
        const publicApi = new DigitrafficRestApi(stack, 'NauticalWarnings-public', 'NauticalWarnings Public API');
        this.apiKeyId = createUsagePlan(publicApi, 'NauticalWarnings Api Key', 'NauticalWarnings Usage Plan').keyId;

        this.createResources(publicApi);
        this.createEndpoint(stack, secret);
    }

    createResources(publicApi: DigitrafficRestApi) {
        const apiResource = publicApi.root.addResource("api");
        const csResource = apiResource.addResource("nautical-warnings");
        const betaResource = csResource.addResource("beta");
        this.activeResource = betaResource.addResource("active");
        this.archivedResource = betaResource.addResource("archived");

        this.activeWarningsModel = publicApi.addModel('WarningResponseModel', MessageModel);
    }

    createEndpoint(stack: DigitrafficStack, secret: ISecret) {
        const environment = stack.createDefaultLambdaEnvironment('NauticalWarnings');
        const functionNameActive = 'NauticalWarnings-GetActive';
        const functionNameArchived = 'NauticalWarnings-GetArchived';

        const lambdaConfActive = dbFunctionProps(stack, {
            architecture: Architecture.ARM_64,
            environment,
            functionName: functionNameActive,
            code: new AssetCode('dist/lambda/get-warnings'),
            handler: 'get-active.handler',
        });
        const lambdaConfArchived = dbFunctionProps(stack, {
            architecture: Architecture.ARM_64,
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
                corsMethod(methodResponse("200", MediaType.APPLICATION_GEOJSON, this.activeWarningsModel)),
                corsMethod(methodResponse("500", MediaType.TEXT_PLAIN, this.activeWarningsModel))
            ]
        });

        this.archivedResource.addMethod("GET", archivedIntegration, {
            apiKeyRequired: false,
            methodResponses: [
                corsMethod(methodResponse("200", MediaType.APPLICATION_GEOJSON, this.activeWarningsModel)),
                corsMethod(methodResponse("500", MediaType.TEXT_PLAIN, this.activeWarningsModel))
            ]
        });

    }
}
