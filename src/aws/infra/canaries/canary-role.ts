import {
    ManagedPolicy,
    PolicyStatement,
    type PolicyStatementProps,
    Role,
    ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

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

const CLOUDWATCH_STATEMENT_PROPS: PolicyStatementProps = {
    actions: ["cloudwatch:PutMetricData"],
    resources: ["*"],
    conditions: {
        StringEquals: {
            "cloudwatch:namespace": "CloudWatchSynthetics",
        },
    },
};

export class DigitrafficCanaryRole extends Role {
    constructor(stack: Construct, canaryName: string) {
        super(stack, "canary-role-" + canaryName, {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName(
                    "CloudWatchSyntheticsFullAccess"
                ),
            ],
        });

        this.addToPolicy(new PolicyStatement(BASE_POLICY_STATEMENT_PROPS));
        this.addToPolicy(new PolicyStatement(CLOUDWATCH_STATEMENT_PROPS));
    }

    /**
     * Provides permissions to access resources within a VPC.
     */
    withDatabaseAccess(): this {
        // Won't work :(
        // this.addToPolicy(new PolicyStatement(DB_STATEMENT_PROPS));
        // Works
        this.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName(
                "service-role/AWSLambdaVPCAccessExecutionRole"
            )
        );
        return this;
    }

    /**
     * Same as withDatabaseAccess() - renamed to avoid confusion if used with UrlCanary.
     * A UrlCanary needs these permissions to e.g. access a private API Gateway endpoint in a VPC.
     */
    withVpcAccess(): this {
        this.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName(
                "service-role/AWSLambdaVPCAccessExecutionRole"
            )
        );
        return this;
    }
}
