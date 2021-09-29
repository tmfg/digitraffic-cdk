import {Construct, Duration} from "@aws-cdk/core";
import {AssetCode, Canary, Runtime, Schedule, Test} from "@aws-cdk/aws-synthetics";
import {LambdaEnvironment} from "../model/lambda-environment";
import {ManagedPolicy, PolicyStatement, Role, ServicePrincipal} from "@aws-cdk/aws-iam";

export function createCanary(scope: Construct, canaryName: string, handler: string, role: Role, environmentVariables: LambdaEnvironment, schedule?: Schedule): Canary {
    return new Canary(scope, canaryName, {
        runtime: Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_2,
        role,
        test: Test.custom({
            code: new AssetCode("dist", {
                exclude: ["lambda"]
            }),
            handler,
        }),
        environmentVariables,
        canaryName,
        schedule: schedule ?? Schedule.rate(Duration.minutes(15))
    });
}

export function createCanaryRole(stack: Construct, canaryName: string): Role {
    const role = new Role(stack, "canary-role-" + canaryName, {
        assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
        managedPolicies: [
            ManagedPolicy.fromAwsManagedPolicyName("CloudWatchSyntheticsFullAccess")
        ]
    });

    role.addToPolicy(new PolicyStatement({
            actions: [
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:CreateLogGroup",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams",
                "cloudwatch:PutMetricData",
                "ec2:CreateNetworkInterface",
                "ec2:DescribeNetworkInterfaces",
                "ec2:DeleteNetworkInterface"
            ],
            resources: ["*"]
        })
    );

    return role;
}
