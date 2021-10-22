import {
    LambdaIntegration,
    MockIntegration,
    PassthroughBehavior,
    RequestValidator,
    Resource,
    RestApi
} from '@aws-cdk/aws-apigateway';
import {Function} from '@aws-cdk/aws-lambda';
import {createTimestampSchema, LocationSchema, ShipSchema} from './model/timestamp-schema';
import {DigitrafficLogSubscriptions} from 'digitraffic-common/stack/subscription';
import {
    corsMethod,
    defaultIntegration,
    getResponse,
    methodResponse,
    RESPONSE_200_OK,
    RESPONSE_400_BAD_REQUEST,
    RESPONSE_500_SERVER_ERROR,
} from "digitraffic-common/api/responses";
import {MessageModel} from "digitraffic-common/api/response";
import {addDefaultValidator, addServiceModel, createArraySchema, getModelReference} from "digitraffic-common/api/utils";
import {databaseFunctionProps} from "digitraffic-common/stack/lambda-configs";
import {addQueryParameterDescription, addTagsAndSummary} from "digitraffic-common/api/documentation";
import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {DigitrafficRestApi} from "digitraffic-common/api/rest_apis";
import {TimestampMetadata} from './model/timestamp-metadata';
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {MediaType} from "digitraffic-common/api/mediatypes";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";

export class PublicApi {
    readonly apiKeyId: string;
    readonly publicApi: DigitrafficRestApi;

    constructor(stack: DigitrafficStack, secret: ISecret) {
        this.publicApi = new DigitrafficRestApi(stack, 'PortActivity-public', 'PortActivity public API');

        this.apiKeyId = createUsagePlan(this.publicApi, 'PortActivity timestamps Api Key', 'PortActivity timestamps Usage Plan').keyId;

        const validator = addDefaultValidator(this.publicApi);

        const shipModel = addServiceModel("ShipModel", this.publicApi, ShipSchema);
        const locationModel = addServiceModel("LocationModel", this.publicApi, LocationSchema);
        const timestampModel = addServiceModel("TimestampModel",
            this.publicApi,
            createTimestampSchema(
                getModelReference(shipModel.modelId, this.publicApi.restApiId),
                getModelReference(locationModel.modelId, this.publicApi.restApiId)));
        const timestampsModel = addServiceModel("TimestampsModel", this.publicApi, createArraySchema(timestampModel, this.publicApi));
        const errorResponseModel = this.publicApi.addModel('MessageResponseModel', MessageModel);

        const resource = this.publicApi.root
            .addResource("api")
            .addResource("v1");

        this.createTimestampsResource(stack, resource, timestampsModel, errorResponseModel, validator, secret);
        this.createShiplistResource(stack, this.publicApi, secret);
        this.createTimestampMetadataResource(stack, this.publicApi, resource);
    }

    createTimestampsResource(
        stack: DigitrafficStack,
        resource: Resource,
        timestampsJsonModel: any,
        errorResponseModel: any,
        validator: RequestValidator,
        secret: ISecret): Function {

        const functionName = 'PortActivity-GetTimestamps';
        const environment = stack.createDefaultLambdaEnvironment('PortActivity');

        const getTimestampsLambda = MonitoredFunction.create(stack, functionName, databaseFunctionProps(stack, environment, functionName, 'get-timestamps', {
            timeout: 10,
            reservedConcurrentExecutions: 6,
        }), {
            errorAlarmProps: {
                create: true,
                threshold: 3
            }
        });

        secret.grantRead(getTimestampsLambda);
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
                    source: "$util.escapeJavaScript($input.params('source'))"
                })
            },
            responses: [
                getResponse(RESPONSE_200_OK),
                getResponse(RESPONSE_400_BAD_REQUEST),
                getResponse(RESPONSE_500_SERVER_ERROR)
            ]
        });

        const timestampResource = resource.addResource('timestamps');
        timestampResource.addMethod("GET", getTimestampsIntegration, {
            apiKeyRequired: true,
            requestParameters: {
                'method.request.querystring.locode': false,
                'method.request.querystring.mmsi': false,
                'method.request.querystring.imo': false,
                'method.request.querystring.source': false
            },
            requestValidator: validator,
            methodResponses: [
                corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, timestampsJsonModel)),
                corsMethod(methodResponse("400", MediaType.APPLICATION_JSON, errorResponseModel)),
                corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, errorResponseModel))
            ]
        });

        addTagsAndSummary('GetTimestamps',
            ['timestamps'],
            'Retrieves ship timestamps by ship or port',
            timestampResource,
            stack);
        addQueryParameterDescription('locode', 'Port LOCODE', timestampResource, stack);
        addQueryParameterDescription('mmsi', 'Ship MMSI', timestampResource, stack);
        addQueryParameterDescription('imo', 'Ship IMO', timestampResource, stack);

        return getTimestampsLambda;
    }

    createShiplistResource(stack: DigitrafficStack, publicApi: RestApi, secret: ISecret): Function {
        const functionName = 'PortActivity-PublicShiplist';
        const environment = stack.createDefaultLambdaEnvironment('PortActivity');

        const lambda = MonitoredFunction.create(stack, functionName, databaseFunctionProps(stack, environment, functionName, 'get-shiplist-public', {
            timeout: 10,
        }));

        secret.grantRead(lambda);

        const integration = new LambdaIntegration(lambda, {
            proxy: true
        });

        const shiplistResource = publicApi.root.addResource("shiplist");
        shiplistResource.addMethod("GET", integration, {
            apiKeyRequired: false
        });

        new DigitrafficLogSubscriptions(stack, lambda);

        addTagsAndSummary('Shiplist',
            ['shiplist'],
            'Returns a list of ships as an HTML page',
            shiplistResource,
            stack);

        return lambda;
    }

    createTimestampMetadataResource(
        stack: DigitrafficStack,
        publicApi: RestApi,
        resource: Resource) {

        const integration = new MockIntegration({
            passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
            requestTemplates: {
                'application/json': `{
                "statusCode": 200
            }`
            },
            integrationResponses: [{
                statusCode: '200',
                responseTemplates: {
                    'application/json': JSON.stringify(TimestampMetadata)
                }
            }]
        });

        const metadataResource = resource.addResource('metadata');

        metadataResource.addMethod("GET", integration, {
            apiKeyRequired: false,
            methodResponses: [{
                statusCode: '200'
            }]
        });

        addTagsAndSummary('Timestamp metadata',
            ['metadata'],
            'Returns timestamp related metadata',
            metadataResource,
            stack);
    }
}
