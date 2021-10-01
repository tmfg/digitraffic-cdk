import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {DigitrafficRestApi} from "digitraffic-common/api/rest_apis";
import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {Model, Resource} from "@aws-cdk/aws-apigateway";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {AssetCode} from "@aws-cdk/aws-lambda";
import {dbFunctionProps} from "digitraffic-common/stack/lambda-configs";
import {DatabaseEnvironmentKeys} from "digitraffic-common/secrets/dbsecret";
import {LambdaEnvironment, SECRET_ID} from "digitraffic-common/model/lambda-environment";
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/api/responses";
import {MediaType} from "digitraffic-common/api/mediatypes";
import {MessageModel} from "digitraffic-common/api/response";

export class PublicApi {
    metadataResource: Resource;
    errorResponseModel: Model;
    metadataResponseModel: Model;

    constructor(stack: DigitrafficStack, secret: ISecret) {
        const publicApi = new DigitrafficRestApi(stack, 'CountingSites-public', 'Counting Sites Public API');

        createUsagePlan(publicApi, 'CS Api Key', 'CS Usage Plan');

        this.createResources(publicApi);
        this.createMetadataEndpoint(stack, secret);
    }

    createResources(publicApi: DigitrafficRestApi) {
        const apiResource = publicApi.root.addResource("api");
        const csResource = apiResource.addResource("counting-sites");
        const betaResource = csResource.addResource("beta");
        this.metadataResource = betaResource.addResource("metadata");

//        this.errorResponseModel = publicApi.addModel('ErrorResponseModel', MessageModel);
        this.metadataResponseModel = publicApi.addModel('MetadataResponseModel', MessageModel);
    }

    createMetadataEndpoint(stack: DigitrafficStack, secret: ISecret) {
        const environment = stack.createDefaultLambdaEnvironment('CountingSites');

        const lambdaConf = dbFunctionProps(stack, {
            environment,
            functionName: 'CountingSites-GetMetadata',
            code: new AssetCode('dist/lambda/get-metadata'),
            handler: 'get-metadata.handler',
        });

        const lambda = new MonitoredFunction(stack, 'metadata-lambda', lambdaConf, stack.alarmTopic, stack.warningTopic);
        secret.grantRead(lambda);

        const metadataIntegration = defaultIntegration(lambda);

        this.metadataResource.addMethod("GET", metadataIntegration, {
            apiKeyRequired: false,
            methodResponses: [
                corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, this.metadataResponseModel)),
                corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, this.metadataResponseModel))
            ]
        });
    }
}
