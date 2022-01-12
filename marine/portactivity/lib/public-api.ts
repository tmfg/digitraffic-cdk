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
import {DigitrafficLogSubscriptions} from 'digitraffic-common/aws/infra/stack/subscription';
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/aws/infra/api/responses";
import {MessageModel} from "digitraffic-common/aws/infra/api/response";
import {addDefaultValidator, addServiceModel, createArraySchema, getModelReference} from "digitraffic-common/utils/api-model";
import {addQueryParameterDescription, addTagsAndSummary} from "digitraffic-common/aws/infra/documentation";
import {createUsagePlan} from "digitraffic-common/aws/infra/usage-plans";
import {DigitrafficRestApi} from "digitraffic-common/aws/infra/stack/rest_apis";
import {TimestampMetadata} from './model/timestamp-metadata';
import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {MediaType} from "digitraffic-common/aws/types/mediatypes";
import {MonitoredFunction} from "digitraffic-common/aws/infra/stack/monitoredfunction";
import {DigitrafficIntegrationResponse} from "digitraffic-common/aws/infra/digitraffic-integration-response";
import {IModel} from "aws-cdk-lib/aws-apigateway/lib/model";

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
        const environment = stack.createLambdaEnvironment();

        const getTimestampsLambda = MonitoredFunction.createV2(stack, 'get-timestamps', environment, {
            timeout: 10,
            reservedConcurrentExecutions: 10,
            errorAlarmProps: {
                create: true,
                threshold: 3,
            },
        });

        stack.grantSecret(getTimestampsLambda);
        new DigitrafficLogSubscriptions(stack, getTimestampsLambda);

        const getTimestampsIntegration = defaultIntegration(getTimestampsLambda, {
            requestParameters: {
                'integration.request.querystring.locode': 'method.request.querystring.locode',
                'integration.request.querystring.mmsi': 'method.request.querystring.mmsi',
                'integration.request.querystring.imo': 'method.request.querystring.imo',
                'integration.request.querystring.source': 'method.request.querystring.source',
            },
            requestTemplates: {
                'application/json': JSON.stringify({
                    locode: "$util.escapeJavaScript($input.params('locode'))",
                    mmsi: "$util.escapeJavaScript($input.params('mmsi'))",
                    imo: "$util.escapeJavaScript($input.params('imo'))",
                    source: "$util.escapeJavaScript($input.params('source'))",
                }),
            },
            responses: [
                DigitrafficIntegrationResponse.ok(MediaType.APPLICATION_JSON),
                DigitrafficIntegrationResponse.badRequest(),
            ],
        });

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

        addTagsAndSummary(
            'GetTimestamps',
            ['timestamps'],
            'Retrieves ship timestamps by ship or port',
            timestampResource,
            stack,
        );
        addQueryParameterDescription('locode', 'Port LOCODE', timestampResource, stack);
        addQueryParameterDescription('mmsi', 'Ship MMSI', timestampResource, stack);
        addQueryParameterDescription('imo', 'Ship IMO', timestampResource, stack);

        return getTimestampsLambda;
    }

    createShiplistResource(stack: DigitrafficStack, publicApi: RestApi): Function {
        const environment = stack.createLambdaEnvironment();

        const lambda = MonitoredFunction.createV2(stack, 'get-shiplist-public', environment, {
            functionName: 'PortActivity-PublicShiplist',
            timeout: 10,
            reservedConcurrentExecutions: 6,
        });

        stack.grantSecret(lambda);

        const integration = new LambdaIntegration(lambda, {
            proxy: true,
        });

        const shiplistResource = publicApi.root.addResource("shiplist");
        shiplistResource.addMethod("GET", integration, {
            apiKeyRequired: false,
        });

        new DigitrafficLogSubscriptions(stack, lambda);

        addTagsAndSummary(
            'Shiplist',
            ['shiplist'],
            'Returns a list of ships as an HTML page',
            shiplistResource,
            stack,
        );

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

        addTagsAndSummary(
            'Timestamp metadata',
            ['metadata'],
            'Returns timestamp related metadata',
            metadataResource,
            stack,
        );
    }
}
