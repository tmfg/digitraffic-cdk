import {Model, RequestValidator, RestApi} from '@aws-cdk/aws-apigateway';
import {Construct} from '@aws-cdk/core';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {LambdaConfiguration} from '../../../common/stack/lambda-configs';
import {createRestApi} from '../../../common/api/rest_apis';
import {Queue} from '@aws-cdk/aws-sqs';
import {attachQueueToApiGatewayResource} from "../../../common/api/sqs";
import {addServiceModel, getModelReference} from "../../../common/api/utils";
import {createTimestampSchema, LocationSchema, ShipSchema} from "./model/timestamp-schema";

export function create(
    queue: Queue,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: LambdaConfiguration,
    stack: Construct)
{
    const integrationApi = createRestApi(stack,
        'PortActivity-Integration',
        'Port Activity integration API');
    const shipModel = addServiceModel("ShipModel", integrationApi, ShipSchema);
    const locationModel = addServiceModel("LocationModel", integrationApi, LocationSchema);
    const timestampModel = addServiceModel("TimestampModel",
        integrationApi,
        createTimestampSchema(
            getModelReference(shipModel.modelId, integrationApi.restApiId),
            getModelReference(locationModel.modelId, integrationApi.restApiId)));
    createUpdateTimestampResource(stack, integrationApi, queue, timestampModel);
    createUsagePlan(integrationApi);
}

function createUpdateTimestampResource(
    stack: Construct,
    integrationApi: RestApi,
    queue: Queue,
    timestampModel: Model) {
    const apiResource = integrationApi.root.addResource('api');
    const integrationResource = apiResource.addResource('integration');
    const timestampResource = integrationResource.addResource('timestamps');
    const requestValidator = new RequestValidator(stack, 'RequestValidator', {
        validateRequestBody: true,
        validateRequestParameters: true,
        requestValidatorName: 'PortActivityTimestampIntegrationRequestValidator',
        restApi: integrationApi
    });
    attachQueueToApiGatewayResource(stack,
        queue,
        timestampResource,
        requestValidator,
        'PortCallTimestamp',
        true,
        {
            'application/json': timestampModel
        });
}

function createUsagePlan(integrationApi: RestApi) {
    const apiKey = integrationApi.addApiKey('Port Activity Integration API key');
    const plan = integrationApi.addUsagePlan('Port Activity Integration Usage Plan', {
        name: 'Integration Usage Plan',
        apiKey
    });
    plan.addApiStage({
        stage: integrationApi.deploymentStage
    });
}
