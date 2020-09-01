import {Model, RequestValidator, RestApi} from '@aws-cdk/aws-apigateway';
import {Construct} from '@aws-cdk/core';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {LambdaConfiguration} from '../../common/stack/lambda-configs';
import {createRestApi} from '../../common/api/rest_apis';
import {Queue} from '@aws-cdk/aws-sqs';
import {attachQueueToApiGatewayResource} from "../../common/api/sqs";
import {addServiceModel, getModelReference} from "../../common/api/utils";
import {createEstimateSchema, LocationSchema, ShipSchema} from "./model/estimate-schema";

export function create(
    queue: Queue,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: LambdaConfiguration,
    stack: Construct)
{
    const integrationApi = createRestApi(stack,
        'PortcallEstimates-Integration',
        'Portcall Estimates integration API');
    const shipModel = addServiceModel("ShipModel", integrationApi, ShipSchema);
    const locationModel = addServiceModel("LocationModel", integrationApi, LocationSchema);
    const estimateModel = addServiceModel("EstimateModel",
        integrationApi,
        createEstimateSchema(
            getModelReference(shipModel.modelId, integrationApi.restApiId),
            getModelReference(locationModel.modelId, integrationApi.restApiId)));
    createUpdateEstimateResource(stack, integrationApi, queue, estimateModel);
    createUsagePlan(integrationApi);
}

function createUpdateEstimateResource(
    stack: Construct,
    integrationApi: RestApi,
    queue: Queue,
    estimateModel: Model) {
    const apiResource = integrationApi.root.addResource('api');
    const integrationResource = apiResource.addResource('integration');
    const estimateResource = integrationResource.addResource('portcall-estimates');
    const requestValidator = new RequestValidator(stack, 'RequestValidator', {
        validateRequestBody: true,
        validateRequestParameters: true,
        requestValidatorName: 'PortcallEstimateIntegrationRequestValidator',
        restApi: integrationApi
    });
    attachQueueToApiGatewayResource(stack,
        queue,
        estimateResource,
        requestValidator,
        'PortcallEstimate',
        true,
        {
            'application/json': estimateModel
        });
}

function createUsagePlan(integrationApi: RestApi) {
    const apiKey = integrationApi.addApiKey('Portcall Estimates Integration API key');
    const plan = integrationApi.addUsagePlan('Portcall Estimates Integration Usage Plan', {
        name: 'Integration Usage Plan',
        apiKey
    });
    plan.addApiStage({
        stage: integrationApi.deploymentStage
    });
}
