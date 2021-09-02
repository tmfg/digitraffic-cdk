import {Props} from "./app-props";
import {Queue} from "@aws-cdk/aws-sqs";
import {SnsAction} from "@aws-cdk/aws-cloudwatch-actions";
import {Topic} from "@aws-cdk/aws-sns";
import {ComparisonOperator, TreatMissingData} from "@aws-cdk/aws-cloudwatch";
import {Construct} from "@aws-cdk/core";
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {ManagedPolicy, PolicyStatement, Role, ServicePrincipal} from '@aws-cdk/aws-iam';
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {UrlTestCanary} from "digitraffic-common/canaries/url-test-canary";
import {DbTestCanary} from "digitraffic-common/canaries/db-test-canary";

export function create(stack: Construct,
                       secret: ISecret,
                       vpc: IVpc,
                       lambdaDbSg: ISecurityGroup,
                       dlq: Queue,
                       appProps: Props) {
    addDLQAlarm(stack, dlq, appProps);

    const role = createCanaryRole(stack);

    new UrlTestCanary(stack, role, {
        name: 'shiplist',
        hostname: "portactivity-test.digitraffic.fi"
    });

    new DbTestCanary(stack, secret, role, vpc, lambdaDbSg, {
        name: 'db-test',
        secret: appProps.secretId
    });
}

function createCanaryRole(stack: Construct) {
    const role = new Role(stack, "canary-role", {
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
                'ec2:CreateNetworkInterface', 'ec2:DescribeNetworkInterfaces', 'ec2:DeleteNetworkInterface'
            ],
            resources: ["*"]
        })
    );

    return role;
}

function addDLQAlarm(stack: Construct, queue: Queue, appProps: Props) {
    const alarmName = 'PortActivity-TimestampsDLQAlarm';
    queue.metricNumberOfMessagesReceived({
        period: appProps.dlqNotificationDuration
    }).createAlarm(stack, alarmName, {
        alarmName,
        threshold: 0,
        evaluationPeriods: 1,
        treatMissingData: TreatMissingData.NOT_BREACHING,
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD
    }).addAlarmAction(new SnsAction(Topic.fromTopicArn(stack, 'Topic', appProps.dlqNotificationTopicArn)));
}
