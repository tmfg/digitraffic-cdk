import apigateway = require('@aws-cdk/aws-apigateway');
import iam = require('@aws-cdk/aws-iam');

const lambda = require('@aws-cdk/aws-lambda');
const ec2 = require('@aws-cdk/aws-ec2');
import {EndpointType, LambdaIntegration} from "@aws-cdk/aws-apigateway";
import * as TestStackProps from "./stackprops-test";
import {Construct, Duration} from "@aws-cdk/core";
import {Props} from "./app-props";
import {SubnetType} from "@aws-cdk/aws-ec2";

export function create(stack: Construct, props: Props) {
    const publicApi = new apigateway.RestApi(stack, 'Open311-public', {
        deployOptions: {
            loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        },
        restApiName: 'Open311 public API',
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
                            "aws:sourceVpc": TestStackProps.default.vpcId
                        }
                    },
                    principals: [
                        new iam.AnyPrincipal()
                    ]
                })
            ]
        })
    });

    const vpc = ec2.Vpc.fromVpcAttributes(stack, 'vpc', {
        vpcId: TestStackProps.default.vpcId,
        privateSubnetIds: TestStackProps.default.privateSubnetIds,
        availabilityZones: TestStackProps.default.availabilityZones
    });

    const getRequestsHandler = new lambda.Function(stack, 'GetRequestsLambda', {
        code: new lambda.AssetCode('lib'),
        handler: 'lambda-get-requests.handler',
        runtime: lambda.Runtime.NODEJS_10_X,
        environment: {
            DB_USER: props.dbProps.username,
            DB_PASS: props.dbProps.password,
            DB_URI: props.dbProps.uri
        },
        timeout: Duration.seconds(10),
        vpc: vpc,
        vpcSubnets: vpc.privateSubnets,
        securityGroup: ec2.SecurityGroup.fromSecurityGroupId(stack, 'LambdaDbSG', props.lambdaDbSgId)
    });
    const getRequestsIntegration = new LambdaIntegration(getRequestsHandler);
    const requests = publicApi.root.addResource("requests");
    requests.addMethod("GET", getRequestsIntegration);

    const getRequestHandler = new lambda.Function(stack, 'GetRequestLambda', {
        code: new lambda.AssetCode('lib'),
        handler: 'get-request.handler',
        runtime: lambda.Runtime.NODEJS_10_X
    });
    const getRequestIntegration = new LambdaIntegration(getRequestHandler);
    const request = requests.addResource("{request_id}");
    request.addMethod("GET", getRequestIntegration);
}
