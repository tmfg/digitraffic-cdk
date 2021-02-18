import {
    EndpointType,
    LambdaIntegration,
    MethodLoggingLevel,
    RequestValidator,
    Resource,
    RestApi
} from '@aws-cdk/aws-apigateway';
import {AnyPrincipal, Effect, PolicyDocument, PolicyStatement} from '@aws-cdk/aws-iam';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {Construct} from "@aws-cdk/core";
import {createTimestampSchema, LocationSchema, ShipSchema} from './model/timestamp-schema';
import {createSubscription} from '../../../common/stack/subscription';
import {corsMethod, methodResponse, defaultIntegration,} from "../../../common/api/responses";
import {MessageModel} from "../../../common/api/response";
import {addDefaultValidator, addServiceModel, createArraySchema, getModelReference} from "../../../common/api/utils";
import {dbLambdaConfiguration} from "../../../common/stack/lambda-configs";
import {Props} from "./app-props";
import {addQueryParameterDescription, addTagsAndSummary} from "../../../common/api/documentation";
import {createUsagePlan} from "../../../common/stack/usage-plans";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {APPLICATION_JSON} from "../../portcall-estimates/tsd/common/api/response";
import {MediaType} from "../../../common/api/mediatypes";

export function create(
    secret: ISecret,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: Props,
    stack: Construct) {
    const publicApi = createApi(stack);

    createUsagePlan(publicApi, 'PortActivity timestamps Api Key', 'PortActivity timestamps Usage Plan');

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
        .addResource("v1")
        .addResource('timestamps');

    createTimestampsResource(publicApi, secret, vpc, props, resource, lambdaDbSg, timestampsModel, errorResponseModel, validator, stack);
    createShiplistResource(publicApi, secret, vpc, props, lambdaDbSg, stack);
}

function createTimestampsResource(
    publicApi: RestApi,
    secret: ISecret,
    vpc: IVpc,
    props: Props,
    resource: Resource,
    lambdaDbSg: ISecurityGroup,
    timestampsJsonModel: any,
    errorResponseModel: any,
    validator: RequestValidator,
    stack: Construct): Function {

    const functionName = 'PortActivity-GetTimestamps';
    const assetCode = new AssetCode('dist/lambda/get-timestamps');
    const getTimestampsLambda = new Function(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: assetCode,
        handler: 'lambda-get-timestamps.handler',
        readOnly: false,
        environment: {
            SECRET_ID: props.secretId
        }
    }));
    secret.grantRead(getTimestampsLambda);
    const getTimestampsIntegration = defaultIntegration(getTimestampsLambda, {
        requestParameters: {
            'integration.request.querystring.locode': 'method.request.querystring.locode',
            'integration.request.querystring.mmsi': 'method.request.querystring.mmsi',
            'integration.request.querystring.imo': 'method.request.querystring.imo'
        },
        requestTemplates: {
            'application/json': JSON.stringify({
                locode: "$util.escapeJavaScript($input.params('locode'))",
                mmsi: "$util.escapeJavaScript($input.params('mmsi'))",
                imo: "$util.escapeJavaScript($input.params('imo'))"
            })
        }
    });

    resource.addMethod("GET", getTimestampsIntegration, {
        apiKeyRequired: true,
        requestParameters: {
            'method.request.querystring.locode': false,
            'method.request.querystring.mmsi': false,
            'method.request.querystring.imo': false
        },
        requestValidator: validator,
        methodResponses: [
            corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, timestampsJsonModel)),
            corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, errorResponseModel))
        ]
    });

    createSubscription(getTimestampsLambda, functionName, props.logsDestinationArn, stack);
    addTagsAndSummary('GetTimestamps',
        ['timestamps'],
        'Retrieves ship timestamps by ship or port',
        resource,
        stack);
    addQueryParameterDescription('locode', 'Port LOCODE', resource, stack);
    addQueryParameterDescription('mmsi', 'Ship MMSI', resource, stack);
    addQueryParameterDescription('imo', 'Ship IMO', resource, stack);

    return getTimestampsLambda;
}

function createShiplistResource(
    publicApi: RestApi,
    secret: ISecret,
    vpc: IVpc,
    props: Props,
    lambdaDbSg: ISecurityGroup,
    stack: Construct): Function {

    const functionName = 'PortActivity-PublicShiplist';

    const assetCode = new AssetCode('dist/lambda/get-shiplist-public');
    const lambda = new Function(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: assetCode,
        handler: 'lambda-get-shiplist-public.handler',
        readOnly: false,
        environment: {
            SECRET_ID: props.secretId
        }
    }));
    secret.grantRead(lambda);
    const integration = new LambdaIntegration(lambda, {
        proxy: true
    });

    const shiplistResource = publicApi.root.addResource("shiplist");
    shiplistResource.addMethod("GET", integration, {
        apiKeyRequired: false
    });

    createSubscription(lambda, functionName, props.logsDestinationArn, stack);
    addTagsAndSummary('Shiplist',
        ['shiplist'],
        'Returns a list of ships as an HTML page',
        shiplistResource,
        stack);

    return lambda;
}

function createApi(stack: Construct) {
    return new RestApi(stack, 'PortActivity-public', {
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
