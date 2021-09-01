import {Props} from "./app-props";
import {Queue} from "@aws-cdk/aws-sqs";
import {SnsAction} from "@aws-cdk/aws-cloudwatch-actions";
import {Topic} from "@aws-cdk/aws-sns";
import {ComparisonOperator, TreatMissingData} from "@aws-cdk/aws-cloudwatch";
import {Construct} from "@aws-cdk/core";
import {UrlTestCanary} from "digitraffic-common/canaries/url-test-canary";

export function create(stack: Construct, dlq: Queue, appProps: Props) {
    addDLQAlarm(stack, dlq, appProps);

    new UrlTestCanary(stack, {
        name: 'shiplist',
        url: "https://portactivity-test.digitraffic.fi/shiplist?locode=FIKTK"
    });
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
