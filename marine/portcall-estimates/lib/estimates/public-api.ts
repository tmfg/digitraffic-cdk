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
import {createEstimateSchema, LocationSchema, ShipSchema} from './model/estimate-schema';
import {createSubscription} from '../../../../common/stack/subscription';
import {defaultIntegration, methodResponse,} from "../../../../common/api/responses";
import {MessageModel} from "../../../../common/api/response";
import {addDefaultValidator, addServiceModel, createArraySchema, getModelReference} from "../../../../common/api/utils";
import {dbLambdaConfiguration} from "../../../../common/stack/lambda-configs";
import {Props} from "./app-props-estimates";
import {addTags} from "../../../../common/api/documentation";
import {createUsagePlan} from "../../../../common/stack/usage-plans";
import {MediaType} from "../../../../common/api/mediatypes";

export function create(
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: Props,
    stack: Construct) {
    const publicApi = createApi(stack);

    createUsagePlan(publicApi, 'Portcall estimates Api Key', 'Portcall estimates Usage Plan');

    const validator = addDefaultValidator(publicApi);

    const shipModel = addServiceModel("ShipModel", publicApi, ShipSchema);
    const locationModel = addServiceModel("LocationModel", publicApi, LocationSchema);
    const estimateModel = addServiceModel("EstimateModel",
        publicApi,
        createEstimateSchema(
            getModelReference(shipModel.modelId, publicApi.restApiId),
            getModelReference(locationModel.modelId, publicApi.restApiId)));
    const estimatesModel = addServiceModel("EstimatesModel", publicApi, createArraySchema(estimateModel, publicApi));
    const errorResponseModel = publicApi.addModel('MessageResponseModel', MessageModel);

    const resource = publicApi.root
        .addResource("api")
        .addResource("v2")
        .addResource('portcall-estimates');

    createEstimatesResource(publicApi, vpc, props, resource, lambdaDbSg, estimatesModel, errorResponseModel, validator, stack);
    createShiplistResource(publicApi, vpc, props, resource, lambdaDbSg, stack);
}

function createEstimatesResource(
    publicApi: RestApi,
    vpc: IVpc,
    props: Props,
    resource: Resource,
    lambdaDbSg: ISecurityGroup,
    estimatesJsonModel: any,
    errorResponseModel: any,
    validator: RequestValidator,
    stack: Construct): Function {

    const functionName = 'PortcallEstimate-GetEstimates';
    const assetCode = new AssetCode('dist/estimates/lambda/get-estimates');
    const getEstimatesLambda = new Function(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: assetCode,
        handler: 'lambda-get-estimates.handler',
        readOnly: false
    }));

    const getEstimatesIntegration = defaultIntegration(getEstimatesLambda, {
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

    resource.addMethod("GET", getEstimatesIntegration, {
        apiKeyRequired: true,
        requestParameters: {
            'method.request.querystring.locode': false,
            'method.request.querystring.mmsi': false,
            'method.request.querystring.imo': false
        },
        requestValidator: validator,
        methodResponses: [
            methodResponse("200", MediaType.APPLICATION_JSON, estimatesJsonModel),
            methodResponse("500", MediaType.APPLICATION_JSON, errorResponseModel)
        ]
    });

    createSubscription(getEstimatesLambda, functionName, props.logsDestinationArn, stack);
    addTags('GetEstimates', ['portcall-estimates'], resource, stack);

    return getEstimatesLambda;
}

function createShiplistResource(
    publicApi: RestApi,
    vpc: IVpc,
    props: Props,
    resource: Resource,
    lambdaDbSg: ISecurityGroup,
    stack: Construct): Function {

    const functionName = 'PortcallEstimate-PublicShiplist';

    const assetCode = new AssetCode('dist/estimates/lambda/get-shiplist-public');
    const lambda = new Function(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: assetCode,
        handler: 'lambda-get-shiplist-public.handler',
        readOnly: false
    }));

    const integration = new LambdaIntegration(lambda, {
        proxy: true
    });

    const shiplistResource = resource.addResource("shiplist");
    shiplistResource.addMethod("GET", integration, {
        apiKeyRequired: false
    });

    createSubscription(lambda, functionName, props.logsDestinationArn, stack);

    return lambda;
}

function createApi(stack: Construct) {
    return new RestApi(stack, 'PortcallEstimate-public', {
        deployOptions: {
            loggingLevel: MethodLoggingLevel.ERROR,
        },
        description: 'Portcall estimates',
        restApiName: 'PortcallEstimates public API',
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
