import type { Stack } from "aws-cdk-lib";
import {
  Alarm,
  ComparisonOperator,
  type Metric,
} from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import type { Topic } from "aws-cdk-lib/aws-sns";

export function createAlarm(
  stack: Stack,
  topic: Topic,
  alarmName: string,
  metric: Metric,
  threshold: number = 1,
  comparisonOperator: ComparisonOperator =
    ComparisonOperator.GREATER_THAN_THRESHOLD,
): void {
  const alarm = new Alarm(stack, alarmName, {
    alarmName,
    metric,
    evaluationPeriods: 5,
    threshold,
    comparisonOperator,
    datapointsToAlarm: 2,
  });

  alarm.addAlarmAction(new SnsAction(topic));
}
