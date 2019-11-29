import apigateway = require('@aws-cdk/aws-apigateway');
import iam = require('@aws-cdk/aws-iam');
const lambda = require('@aws-cdk/aws-lambda');
import {EndpointType, LambdaIntegration} from "@aws-cdk/aws-apigateway";
import {Construct, Duration} from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";

export function create(vpc: ec2.IVpc, lambdaDbSg: ec2.ISecurityGroup, stack: Construct, props: Props) {
    const newRequestHandler = new lambda.Function(stack, 'NewRequestLambda', {
        code: new lambda.AssetCode('lib/lambda/new-request'),
        handler: 'lambda-new-request.handler',
        runtime: lambda.Runtime.NODEJS_10_X,
        timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
        environment: {
            DB_USER: props.dbProps.username,
            DB_PASS: props.dbProps.password,
            DB_URI: props.dbProps.uri
        }
    });
    const newRequestIntegration = new LambdaIntegration(newRequestHandler);

    const integrationApi = new apigateway.RestApi(stack, 'Open311-integration', {
        deployOptions: {
            loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        },
        restApiName: 'Open311 integration API',
        endpointTypes: [EndpointType.PRIVATE],
        policy: new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        "execute-api:Invoke"
                    ],
                    resources: [
                        "*"
                    ],
                    conditions: {
                        "StringEquals": {
                            "aws:sourceVpc": props.vpcId
                        }
                    },
                    principals: [
                        new iam.AnyPrincipal()
                    ]
                })
            ]
        })
    });
    const requests = integrationApi.root.addResource("requests");
    requests.addMethod("POST", newRequestIntegration, {
        apiKeyRequired: true
    });
    const apiKey = integrationApi.addApiKey('Integration API key');
    const plan = integrationApi.addUsagePlan('Integration Usage Plan', {
        name: 'Integration Usage Plan',
        apiKey
    });
    plan.addApiStage({
        stage: integrationApi.deploymentStage
    });
}
