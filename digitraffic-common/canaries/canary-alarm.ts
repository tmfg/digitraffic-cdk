import {Construct} from "@aws-cdk/core";
import {CanaryParameters} from "./canary-parameters";
import {Alarm, ComparisonOperator} from "@aws-cdk/aws-cloudwatch";
import {Canary} from "@aws-cdk/aws-synthetics";

export class CanaryAlarm {
    constructor(scope: Construct, canary: Canary, params: CanaryParameters) {
        if(params.alarm ?? true) {
            new Alarm(scope, `${params.name}-alarm`, {
                alarmDescription: params.alarm?.description ?? '',
                metric: canary.metricSuccessPercent(),
                evaluationPeriods: params.alarm?.evalutionPeriods ?? 2,
                threshold: params.alarm?.threshold ?? 90,
                comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
            });
        }

    }
}