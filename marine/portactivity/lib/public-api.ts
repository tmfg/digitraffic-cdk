import {
    LambdaIntegration,
    MockIntegration,
    PassthroughBehavior,
    RequestValidator,
    Resource,
    RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import {Function} from 'aws-cdk-lib/aws-lambda';
import {createTimestampSchema, LocationSchema, ShipSchema} from './model/timestamp-schema';
import {corsMethod, methodResponse} from "@digitraffic/common/aws/infra/api/responses";
import {MessageModel} from "@digitraffic/common/aws/infra/api/response";
import {
    addDefaultValidator,
    addServiceModel,
    createArraySchema,
    getModelReference
} from "@digitraffic/common/utils/api-model";
import {DocumentationPart} from "@digitraffic/common/aws/infra/documentation";
import {createUsagePlan} from "@digitraffic/common/aws/infra/usage-plans";
import {DigitrafficRestApi} from "@digitraffic/common/aws/infra/stack/rest_apis";
import {TimestampMetadata} from './model/timestamp-metadata';
import {DigitrafficStack} from "@digitraffic/common/aws/infra/stack/stack";
import {MediaType} from "@digitraffic/common/aws/types/mediatypes";
import {MonitoredDBFunction} from "@digitraffic/common/aws/infra/stack/monitoredfunction";
import {IModel} from "aws-cdk-lib/aws-apigateway/lib/model";
import {DigitrafficIntegration} from "@digitraffic/common/aws/infra/api/integration";

export class PublicApi {
    readonly apiKeyId: string;
    readonly publicApi: DigitrafficRestApi;

    constructor(stack: DigitrafficStack) {
        this.publicApi = new DigitrafficRestApi(stack, 'PortActivity-public', 'PortActivity public API');

        this.apiKeyId = createUsagePlan(this.publicApi, 'PortActivity timestamps Api Key', 'PortActivity timestamps Usage Plan').keyId;

        const validator = addDefaultValidator(this.publicApi);

        const shipModel = addServiceModel("ShipModel", this.publicApi, ShipSchema);
        const locationModel = addServiceModel("LocationModel", this.publicApi, LocationSchema);
        const timestampModel = addServiceModel("TimestampModel",
            this.publicApi,
            createTimestampSchema(getModelReference(shipModel.modelId, this.publicApi.restApiId),
                getModelReference(locationModel.modelId, this.publicApi.restApiId)));
        const timestampsModel = addServiceModel("TimestampsModel", this.publicApi, createArraySchema(timestampModel, this.publicApi));
        const errorResponseModel = this.publicApi.addModel('MessageResponseModel', MessageModel);

        const resource = this.publicApi.root
            .addResource("api")
            .addResource("v1");

        this.createTimestampsResource(
            stack, resource, timestampsModel, errorResponseModel, validator,
        );
        this.createShiplistResource(stack, this.publicApi);
        this.createTimestampMetadataResource(stack, this.publicApi, resource);
    }

    createTimestampsResource(
        stack: DigitrafficStack,
        resource: Resource,
        timestampsJsonModel: IModel,
        errorResponseModel: IModel,
        validator: RequestValidator,
    ): Function {
        const getTimestampsLambda = MonitoredDBFunction.create(stack, 'get-timestamps', stack.createLambdaEnvironment(), {
            timeout: 10,
            reservedConcurrentExecutions: 20,
            errorAlarmProps: {
                create: true,
                threshold: 3,
            },
        });

        const getTimestampsIntegration = new DigitrafficIntegration(getTimestampsLambda, MediaType.APPLICATION_JSON)
            .addQueryParameter('locode', 'mmsi', 'imo', 'source')
            .build();

        const timestampResource = resource.addResource('timestamps');
        timestampResource.addMethod("GET", getTimestampsIntegration, {
            apiKeyRequired: true,
            requestParameters: {
                'method.request.querystring.locode': false,
                'method.request.querystring.mmsi': false,
                'method.request.querystring.imo': false,
                'method.request.querystring.source': false,
            },
            requestValidator: validator,
            methodResponses: [
                corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, timestampsJsonModel)),
                {
                    statusCode: '400',
                },
            ],
        });

        this.publicApi.documentResource(timestampResource,
            DocumentationPart.method(['timestamps'], 'GetTimestamps', 'Retrieves ship timestamps by ship or port'),
            DocumentationPart.queryParameter('locode', 'Port LOCODE'),
            DocumentationPart.queryParameter('mmsi', 'Ship MMSI'),
            DocumentationPart.queryParameter('imo', 'Ship IMO'),
            DocumentationPart.queryParameter('source', 'Timestamp source'));

        return getTimestampsLambda;
    }

    createShiplistResource(stack: DigitrafficStack, publicApi: RestApi): Function {
        const lambda = MonitoredDBFunction.create(stack, 'get-shiplist-public', stack.createLambdaEnvironment(), {
            functionName: 'PortActivity-PublicShiplist',
            timeout: 10,
            reservedConcurrentExecutions: 6,
        });

        const integration = new LambdaIntegration(lambda, {
            proxy: true,
        });

        const shiplistResource = publicApi.root.addResource("shiplist");
        shiplistResource.addMethod("GET", integration, {
            apiKeyRequired: false,
        });

        this.publicApi.documentResource(shiplistResource,
            DocumentationPart.method(['shiplist'], 'Shiplist', 'Returns a list of ships as an HTML page'));

        return lambda;
    }

    createTimestampMetadataResource(stack: DigitrafficStack,
        publicApi: RestApi,
        resource: Resource) {

        const integration = new MockIntegration({
            passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
            requestTemplates: {
                'application/json': `{
                "statusCode": 200
            }`,
            },
            integrationResponses: [{
                statusCode: '200',
                responseTemplates: {
                    'application/json': JSON.stringify(TimestampMetadata),
                },
            }],
        });

        const metadataResource = resource.addResource('metadata');

        metadataResource.addMethod("GET", integration, {
            apiKeyRequired: false,
            methodResponses: [{
                statusCode: '200',
            }],
        });

        this.publicApi.documentResource(metadataResource,
            DocumentationPart.method(['metadata'], 'Timestamp metadata', 'Returns timestamp related metadata'));
    }
}
