import {
    EndpointType,
    LambdaIntegration,
    MethodLoggingLevel,
    MockIntegration,
    PassthroughBehavior,
    RequestValidator,
    Resource,
    RestApi
} from '@aws-cdk/aws-apigateway';
import {AnyPrincipal, Effect, PolicyDocument, PolicyStatement} from '@aws-cdk/aws-iam';
import {AssetCode} from '@aws-cdk/aws-lambda';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {Stack} from "@aws-cdk/core";
import {createTimestampSchema, LocationSchema, ShipSchema} from './model/timestamp-schema';
import {createSubscription} from 'digitraffic-common/stack/subscription';
import {
    corsMethod,
    defaultIntegration,
    getResponse,
    methodResponse, RESPONSE_200_OK,
    RESPONSE_400_BAD_REQUEST, RESPONSE_500_SERVER_ERROR,
} from "digitraffic-common/api/responses";
import {MessageModel} from "digitraffic-common/api/response";
import {addDefaultValidator, addServiceModel, createArraySchema, getModelReference} from "digitraffic-common/api/utils";
import {dbLambdaConfiguration} from "digitraffic-common/stack/lambda-configs";
import {Props} from "./app-props";
import {addQueryParameterDescription, addTagsAndSummary} from "digitraffic-common/api/documentation";
import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {MediaType} from "digitraffic-common/api/mediatypes";
import {add404Support} from "digitraffic-common/api/rest_apis";
import {TimestampMetadata} from './model/timestamp-metadata';
import {LambdaEnvironment} from "digitraffic-common/model/lambda-environment";
import {PortactivityEnvKeys} from "./keys";
import {DatabaseEnvironmentKeys} from "digitraffic-common/secrets/dbsecret";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {ITopic} from "@aws-cdk/aws-sns";

export class PublicApi {
    readonly stack: Stack;
    readonly props: Props;
    readonly secret: ISecret;
    readonly apiKeyId: string;

    constructor(
        secret: ISecret,
        vpc: IVpc,
        lambdaDbSg: ISecurityGroup,
        alarmTopic: ITopic,
        warningTopic: ITopic,
        props: Props,
        stack: Stack) {

        this.secret = secret;
        this.props = props;
        this.stack = stack;

        const publicApi = this.createApi();
        add404Support(publicApi, stack);
        this.apiKeyId = createUsagePlan(publicApi, 'PortActivity timestamps Api Key', 'PortActivity timestamps Usage Plan').keyId;

        const validator = addDefaultValidator(publicApi);

        const shipModel = addServiceModel("ShipModel", publicApi, ShipSchema);
        const locationModel = addServiceModel("LocationModel", publicApi, LocationSchema);
        const timestampModel = addServiceModel("TimestampModel",
            publicApi,
            createTimestampSchema(
                getModelReference(shipModel.modelId, publicApi.restApiId),
                getModelReference(locationModel.modelId, publicApi.restApiId)));
        const timestampsModel = addServiceModel("TimestampsModel", publicApi, createArraySchema(timestampModel, publicApi));
        const errorResponseModel = publicApi.addModel('MessageResponseModel', MessageModel);

        const resource = publicApi.root
            .addResource("api")
            .addResource("v1");

        this.createTimestampsResource(
            vpc,
            lambdaDbSg,
            resource,
            timestampsModel,
            errorResponseModel,
            validator,
            alarmTopic,
            warningTopic);
        this.createShiplistResource(publicApi, vpc, lambdaDbSg, alarmTopic, warningTopic);
        this.createTimestampMetadataResource(publicApi, resource);
    }

    createApi(): RestApi {
        return new RestApi(this.stack, 'PortActivity-public', {
            deployOptions: {
                loggingLevel: MethodLoggingLevel.ERROR,
            },
            description: 'PortActivity timestamps',
            restApiName: 'PortActivity public API',
            endpointTypes: [EndpointType.REGIONAL],
            policy: new PolicyDocument({
                statements: [
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: [
                            "execute-api:Invoke"
                        ],
                        resources: [
                            "*"
                        ],
                        principals: [
                            new AnyPrincipal()
                        ]
                    })
                ]
            })
        });
    }

    createTimestampsResource(
        vpc: IVpc,
        lambdaDbSg: ISecurityGroup,
        resource: Resource,
        timestampsJsonModel: any,
        errorResponseModel: any,
        validator: RequestValidator,
        alarmTopic: ITopic,
        warningTopic: ITopic) {

        const functionName = 'PortActivity-GetTimestamps';
        const assetCode = new AssetCode('dist/lambda/get-timestamps');
        const environment: LambdaEnvironment = {};
        environment[PortactivityEnvKeys.SECRET_ID] = this.props.secretId;
        environment[DatabaseEnvironmentKeys.DB_APPLICATION] = 'PortActivity';

        const getTimestampsLambda = new MonitoredFunction(this.stack, functionName,
            dbLambdaConfiguration(vpc, lambdaDbSg, this.props, {
                functionName: functionName,
                memorySize: 128,
                timeout: 10,
                reservedConcurrentExecutions: 2,
                code: assetCode,
                handler: 'lambda-get-timestamps.handler',
                readOnly: false,
                environment
        }), alarmTopic, warningTopic);
        this.secret.grantRead(getTimestampsLambda);

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

        createSubscription(getTimestampsLambda, functionName, this.props.logsDestinationArn, this.stack);
        addTagsAndSummary('GetTimestamps',
            ['timestamps'],
            'Retrieves ship timestamps by ship or port',
            timestampResource,
            this.stack);
        addQueryParameterDescription('locode', 'Port LOCODE', timestampResource, this.stack);
        addQueryParameterDescription('mmsi', 'Ship MMSI', timestampResource, this.stack);
        addQueryParameterDescription('imo', 'Ship IMO', timestampResource, this.stack);

        return getTimestampsLambda;
    }

    createShiplistResource(
        publicApi: RestApi,
        vpc: IVpc,
        lambdaDbSg: ISecurityGroup,
        alarmTopic: ITopic,
        warningTopic: ITopic) {

        const functionName = 'PortActivity-PublicShiplist';
        const assetCode = new AssetCode('dist/lambda/get-shiplist-public');
        const environment: LambdaEnvironment = {};
        environment[PortactivityEnvKeys.SECRET_ID] = this.props.secretId;
        environment[DatabaseEnvironmentKeys.DB_APPLICATION] = 'PortActivity';

        const lambda = new MonitoredFunction(this.stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, this.props, {
            functionName: functionName,
            code: assetCode,
            memorySize: 128,
            timeout: 10,
            handler: 'lambda-get-shiplist-public.handler',
            readOnly: false,
            reservedConcurrentExecutions: 1,
            environment
        }), alarmTopic, warningTopic);
        this.secret.grantRead(lambda);
        const integration = new LambdaIntegration(lambda, {
            proxy: true
        });

        const shiplistResource = publicApi.root.addResource("shiplist");
        shiplistResource.addMethod("GET", integration, {
            apiKeyRequired: false
        });

        createSubscription(lambda, functionName, this.props.logsDestinationArn, this.stack);
        addTagsAndSummary('Shiplist',
            ['shiplist'],
            'Returns a list of ships as an HTML page',
            shiplistResource,
            this.stack);

        return lambda;
    }

    createTimestampMetadataResource(
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
            this.stack);
    }
}
