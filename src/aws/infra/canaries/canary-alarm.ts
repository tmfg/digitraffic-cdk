import type { Construct } from "constructs";
import type { CanaryParameters } from "./canary-parameters.js";
import { Alarm, ComparisonOperator } from "aws-cdk-lib/aws-cloudwatch";
import type { Canary } from "aws-cdk-lib/aws-synthetics";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { Topic } from "aws-cdk-lib/aws-sns";

export class CanaryAlarm {
    constructor(stack: Construct, canary: Canary, params: CanaryParameters) {
        const alarmName = params.alarm?.alarmName ?? `${params.name}-alarm`;

        const alarm = new Alarm(stack, alarmName, {
            alarmName,
            alarmDescription: params.alarm?.description ?? "",
            metric: canary.metricSuccessPercent(),
            evaluationPeriods: params.alarm?.evalutionPeriods ?? 1,
            threshold: params.alarm?.threshold ?? 100,
            comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
        });

        if (params.alarm?.topicArn) {
            alarm.addAlarmAction(
                new SnsAction(
                    Topic.fromTopicArn(
                        stack,
                        `${alarmName}-action`,
                        params.alarm.topicArn,
                    ),
                ),
            );
        }
    }
}
