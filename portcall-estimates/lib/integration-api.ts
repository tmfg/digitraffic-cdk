import {RestApi, Resource, AwsIntegration, PassthroughBehavior} from '@aws-cdk/aws-apigateway';
import {Aws, Construct} from '@aws-cdk/core';
import {IVpc, ISecurityGroup} from '@aws-cdk/aws-ec2';
import {LambdaConfiguration} from '../../common/stack/lambda-configs';
import {createRestApi} from '../../common/api/rest_apis';
import {Queue} from '@aws-cdk/aws-sqs';
import {PolicyStatement, Role, ServicePrincipal} from '@aws-cdk/aws-iam';

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
    attachQueue(stack, estimateResource, queue);
}

function attachQueue(stack: Construct, estimateResource: Resource, queue: Queue) {
    const apiGwRole = new Role(stack, 'PortcallEstimateAPIGatewayToSQSRole', {
        assumedBy: new ServicePrincipal('apigateway.amazonaws.com')
    });
    apiGwRole.addToPolicy(new PolicyStatement({
        resources: [
            queue.queueArn
        ],
        actions: [
            'sqs:SendMessage'
        ]
    }));
    apiGwRole.addToPolicy(new PolicyStatement({
        resources: [
            '*'
        ],
        actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:DescribeLogGroups',
            'logs:DescribeLogStreams',
            'logs:PutLogEvents',
            'logs:GetLogEvents',
            'logs:FilterLogEvents'
        ]
    }));
    const sqsIntegration = new AwsIntegration({
        service: 'sqs',
        integrationHttpMethod: 'POST',
        options: {
            passthroughBehavior: PassthroughBehavior.NEVER,
            credentialsRole: apiGwRole,
            requestParameters: {
                'integration.request.header.Content-Type': "'application/x-www-form-urlencoded'"
            },
            requestTemplates: {
                'application/json': 'Action=SendMessage&MessageBody=$input.body'
            },
            integrationResponses: [
                {
                    statusCode: '200',
                    responseTemplates: {
                        'text/html': 'Success'
                    }
                },
                {
                    statusCode: '500',
                    responseTemplates: {
                        'text/html': 'Error'
                    },
                    selectionPattern: '500'
                }

            ]

        },
        path: Aws.ACCOUNT_ID + '/' + queue.queueName
    });
    estimateResource.addMethod('POST', sqsIntegration, {
        apiKeyRequired: true,
        methodResponses: [
            {
                statusCode: '200',
                responseParameters: {
                    'method.response.header.Content-Type': true
                }
            },
            {
                statusCode: '500',
                responseParameters: {
                    'method.response.header.Content-Type': true
                },
            }
        ]
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
