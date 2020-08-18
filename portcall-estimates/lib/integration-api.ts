import {RestApi} from '@aws-cdk/aws-apigateway';
import {Construct} from '@aws-cdk/core';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {LambdaConfiguration} from '../../common/stack/lambda-configs';
import {createRestApi} from '../../common/api/rest_apis';
import {Queue} from '@aws-cdk/aws-sqs';
import {attachQueueToApiGatewayResource} from "../../common/api/sqs";

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
    createUpdateEstimateResource(stack, integrationApi, queue);
    createUsagePlan(integrationApi);
}

function createUpdateEstimateResource(
    stack: Construct,
    integrationApi: RestApi,
    queue: Queue) {

    const apiResource = integrationApi.root.addResource('api');
    const integrationResource = apiResource.addResource('integration');
    const estimateResource = integrationResource.addResource('portcall-estimates');
    attachQueueToApiGatewayResource(stack, queue, estimateResource, 'PortcallEstimate');
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
