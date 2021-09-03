import {Construct} from "@aws-cdk/core";
import {CanaryParameters} from "./canary-parameters";
import {Alarm, ComparisonOperator} from "@aws-cdk/aws-cloudwatch";
import {Canary} from "@aws-cdk/aws-synthetics";
import {SnsAction} from "@aws-cdk/aws-cloudwatch-actions";
import {Topic} from "@aws-cdk/aws-sns";

export class CanaryAlarm {
    constructor(stack: Construct, canary: Canary, params: CanaryParameters) {
        if(params.alarm ?? true) {
            const alarmName = params.alarm?.alarmName ?? `${params.name}-alarm`;

            const alarm = new Alarm(stack, alarmName, {
                alarmName,
                alarmDescription: params.alarm?.description ?? '',
                metric: canary.metricSuccessPercent(),
                evaluationPeriods: params.alarm?.evalutionPeriods ?? 2,
                threshold: params.alarm?.threshold ?? 90,
                comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
            });

            if(params.alarm?.topicArn) {
                alarm.addAlarmAction(new SnsAction(Topic.fromTopicArn(stack, `${alarmName}-action`, params.alarm.topicArn)));
            }
        }

    }
}