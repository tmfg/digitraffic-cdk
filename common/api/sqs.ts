import {Aws, Construct} from "@aws-cdk/core";
import {AwsIntegration, Model, PassthroughBehavior, RequestValidator, Resource} from "@aws-cdk/aws-apigateway";
import {Queue} from "@aws-cdk/aws-sqs";
import {PolicyStatement, Role, ServicePrincipal} from "@aws-cdk/aws-iam";
import {IModel} from "@aws-cdk/aws-apigateway/lib/model";

export function attachQueueToApiGatewayResource(
    stack: Construct,
    queue: Queue,
    resource: Resource,
    requestValidator: RequestValidator,
    resourceName: string,
    apiKeyRequired: boolean,
    requestModels?: {[param: string]: IModel}
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
    const fifoMessageGroupId = queue.queueName.endsWith(".fifo") ? '&MessageGroupId=SameGroupAlways' : '';
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
                // map the JSON request to a form parameter, FIFO needs also MessageGroupId
                // https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_SendMessage.html
                'application/json': `Action=SendMessage&MessageBody=$util.urlEncode($input.body)${fifoMessageGroupId}`
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
        requestValidator,
        apiKeyRequired,
        requestModels: requestModels ?? {},
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
