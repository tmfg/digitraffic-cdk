import {ManagedPolicy, PolicyStatement, PolicyStatementProps, Role, ServicePrincipal} from "@aws-cdk/aws-iam";
import {Construct} from "@aws-cdk/core";

const BASE_POLICY_STATEMENT_PROPS: PolicyStatementProps = {
    actions: [
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:CreateLogGroup",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
    ],
    resources: ["*"],
};

const DB_STATEMENT_PROPS: PolicyStatementProps = {
    actions: [
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface",
    ],
    resources: ["*"],
};

const CLOUDWATCH_STATEMENT_PROPS: PolicyStatementProps = {
    actions: [
        "cloudwatch:PutMetricData",
    ],
    resources: ["*"],
    conditions: {
        "StringEquals": {
            "cloudwatch:namespace": "CloudWatchSynthetics",
        },
    },
};

export class DigitrafficCanaryRole extends Role {
    constructor(stack: Construct, canaryName: string) {
        super(
            stack, 'canary-role-' + canaryName, {
                assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
                managedPolicies: [
                    ManagedPolicy.fromAwsManagedPolicyName("CloudWatchSyntheticsFullAccess"),
                ],
            },
        );

        this.addToPolicy(new PolicyStatement(BASE_POLICY_STATEMENT_PROPS));
        this.addToPolicy(new PolicyStatement(CLOUDWATCH_STATEMENT_PROPS));
    }

    withDatabaseAccess(): DigitrafficCanaryRole {
        this.addToPolicy(new PolicyStatement(DB_STATEMENT_PROPS));

        return this;
    }
}
