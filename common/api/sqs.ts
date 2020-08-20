import {Aws, Construct} from "@aws-cdk/core";
import {AwsIntegration, PassthroughBehavior, Resource} from "@aws-cdk/aws-apigateway";
import {Queue} from "@aws-cdk/aws-sqs";
import {PolicyStatement, Role, ServicePrincipal} from "@aws-cdk/aws-iam";

export function attachQueueToApiGatewayResource(
    stack: Construct,
    queue: Queue,
    resource: Resource,
    resourceName: string,
    apiKeyRequired: boolean
) {
    // role for API Gateway
    const apiGwRole = new Role(stack, `${resourceName}APIGatewayToSQSRole`, {
        assumedBy: new ServicePrincipal('apigateway.amazonaws.com')
    });
    // grants API Gateway the right to send SQS messages
    apiGwRole.addToPolicy(new PolicyStatement({
        resources: [
            queue.queueArn
        ],
        actions: [
            'sqs:SendMessage'
        ]
    }));
    // grants API Gateway the right write CloudWatch Logs
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
    // create an integration between API Gateway and an SQS queue
    const sqsIntegration = new AwsIntegration({
        service: 'sqs',
        integrationHttpMethod: 'POST',
        options: {
            passthroughBehavior: PassthroughBehavior.NEVER,
            credentialsRole: apiGwRole,
            requestParameters: {
                // SQS requires the Content-Type of the HTTP request to be application/x-www-form-urlencoded
                'integration.request.header.Content-Type': "'application/x-www-form-urlencoded'"
            },
            requestTemplates: {
                // map the JSON request to a form parameter
                'application/json': 'Action=SendMessage&MessageBody=$input.body'
            },
            // these are required by SQS
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
    resource.addMethod('POST', sqsIntegration, {
        apiKeyRequired,
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
