import {Construct, Duration} from "@aws-cdk/core";
import {AssetCode, Canary, Runtime, Schedule, Test} from "@aws-cdk/aws-synthetics";
import {LambdaEnvironment} from "../model/lambda-environment";
import {ManagedPolicy, PolicyStatement, Role, ServicePrincipal} from "@aws-cdk/aws-iam";
import {CanaryAlarm} from "./canary-alarm";
import {CanaryParameters} from "./canary-parameters";

export class DigitrafficCanary extends Canary {
    constructor(scope: Construct, canaryName: string, role: Role, params: CanaryParameters, environmentVariables: LambdaEnvironment) {
        super(scope, canaryName, {
            runtime: Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_2,
            role,
            test: Test.custom({
                code: new AssetCode("dist", {
                    exclude: ["lambda"]
                }),
                handler: params.handler
            }),
            environmentVariables,
            canaryName,
            schedule: params.schedule ?? Schedule.rate(Duration.minutes(15))
        });

        this.artifactsBucket.grantWrite(role);

        if(params.alarm ?? true) {
            new CanaryAlarm(scope, this, params);
        }
    }
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
