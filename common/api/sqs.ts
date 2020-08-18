import {Aws, Construct} from "@aws-cdk/core";
import {AwsIntegration, PassthroughBehavior, Resource} from "@aws-cdk/aws-apigateway";
import {Queue} from "@aws-cdk/aws-sqs";
import {PolicyStatement, Role, ServicePrincipal} from "@aws-cdk/aws-iam";

export function attachQueueToApiGatewayResource(
    stack: Construct,
    queue: Queue,
    estimateResource: Resource,
    resourceName: string) {
    const apiGwRole = new Role(stack, `${resourceName}APIGatewayToSQSRole`, {
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
