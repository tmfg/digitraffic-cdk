import { Aws } from "aws-cdk-lib";
import {
    AwsIntegration,
    PassthroughBehavior,
    RequestValidator,
    Resource,
  type IModel
} from "aws-cdk-lib/aws-apigateway";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export function attachQueueToApiGatewayResource(
    stack: Construct,
    queue: Queue,
    resource: Resource,
    requestValidator: RequestValidator,
    resourceName: string,
    apiKeyRequired: boolean,
    requestModels?: Record<string, IModel>
) {
    // role for API Gateway
    const apiGwRole = new Role(stack, `${resourceName}APIGatewayToSQSRole`, {
        assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
    });
    // grants API Gateway the right to send SQS messages
    apiGwRole.addToPolicy(
        new PolicyStatement({
            resources: [queue.queueArn],
            actions: ["sqs:SendMessage"],
        })
    );
    // grants API Gateway the right write CloudWatch Logs
    apiGwRole.addToPolicy(
        new PolicyStatement({
            resources: ["*"],
            actions: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams",
                "logs:PutLogEvents",
                "logs:GetLogEvents",
                "logs:FilterLogEvents",
            ],
        })
    );
    // create an integration between API Gateway and an SQS queue
    const fifoMessageGroupId = queue.fifo
        ? "&MessageGroupId=AlwaysSameFifoGroup"
        : "";
    const sqsIntegration = new AwsIntegration({
        service: "sqs",
        integrationHttpMethod: "POST",
        options: {
            passthroughBehavior: PassthroughBehavior.NEVER,
            credentialsRole: apiGwRole,
            requestParameters: {
                // SQS requires the Content-Type of the HTTP request to be application/x-www-form-urlencoded
                "integration.request.header.Content-Type":
                    "'application/x-www-form-urlencoded'",
            },
            requestTemplates: {
                // map the JSON request to a form parameter, FIFO needs also MessageGroupId
                // https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_SendMessage.html
                "application/json": `Action=SendMessage${fifoMessageGroupId}&MessageBody=$util.urlEncode($input.body)`,
            },
            // these are required by SQS
            integrationResponses: [
                {
                    statusCode: "200",
                    responseTemplates: {
                        "text/html": "Success",
                    },
                },
                {
                    statusCode: "500",
                    responseTemplates: {
                        "text/html": "Error",
                    },
                    selectionPattern: "500",
                },
            ],
        },
        path: `${Aws.ACCOUNT_ID}/${queue.queueName}`,
    });
    resource.addMethod("POST", sqsIntegration, {
        requestValidator,
        apiKeyRequired,
        requestModels: requestModels ?? {},
        methodResponses: [
            {
                statusCode: "200",
                responseParameters: {
                    "method.response.header.Content-Type": true,
                },
            },
            {
                statusCode: "500",
                responseParameters: {
                    "method.response.header.Content-Type": true,
                },
            },
        ],
    });
}
