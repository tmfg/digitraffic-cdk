import { DigitrafficCanaryRole } from "@digitraffic/common/dist/aws/infra/canaries/canary-role";
import { UrlCanary } from "@digitraffic/common/dist/aws/infra/canaries/url-canary";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import {
  ComparisonOperator,
  TreatMissingData,
} from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import type { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { Topic } from "aws-cdk-lib/aws-sns";
import type { Queue } from "aws-cdk-lib/aws-sqs";
import type { PublicApi } from "./public-api.js";
import type { RamiConfiguration } from "./rami-stack.js";

export function create(
  stack: DigitrafficStack,
  dlq: Queue,
  publicApi: PublicApi,
  secret: ISecret,
): void {
  addDLQAlarm(stack, dlq, stack.configuration as RamiConfiguration);

  if (stack.configuration.stackFeatures?.enableCanaries ?? true) {
    const urlRole = new DigitrafficCanaryRole(stack, "rami-url")
      .withVpcAccess();

    UrlCanary.create(
      stack,
      urlRole,
      publicApi.publicApi,
      {
        name: "rami-public",
        hostname: publicApi.publicApi.hostname(),
        handler: "public-api.handler",
        secret: stack.configuration.secretId,
        alarm: {
          alarmName: "RAMI-PublicAPI-Alarm",
          topicArn: stack.configuration.warningTopicArn,
        },
        inVpc: true,
      },
      secret,
    );
  }
}

function addDLQAlarm(
  stack: DigitrafficStack,
  queue: Queue,
  config: RamiConfiguration,
): void {
  const alarmName = "RAMI-DLQAlarm";
  queue
    .metricNumberOfMessagesReceived({
      period: config.dlqNotificationDuration,
    })
    .createAlarm(stack, alarmName, {
      alarmName,
      threshold: 0,
      evaluationPeriods: 1,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
    })
    .addAlarmAction(
      new SnsAction(Topic.fromTopicArn(stack, "Topic", config.warningTopicArn)),
    );
}
