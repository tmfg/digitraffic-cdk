import {
  SSM_KEY_ALARM_TOPIC,
  SSM_KEY_WARNING_TOPIC,
} from "@digitraffic/common/dist/aws/infra/stack/stack";
import type { StackProps } from "aws-cdk-lib";
import { Stack } from "aws-cdk-lib";
import { Topic } from "aws-cdk-lib/aws-sns";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";
import type { Props } from "./app-props.js";
import * as InternalLambdas from "./internal-lambdas.js";

export class StatusStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    appProps: Props,
    props?: StackProps,
  ) {
    super(scope, id, props);

    const alarmTopic = Topic.fromTopicArn(
      this,
      "AlarmTopic",
      StringParameter.fromStringParameterName(
        this,
        "AlarmTopicParam",
        SSM_KEY_ALARM_TOPIC,
      ).stringValue,
    );
    const warningTopic = Topic.fromTopicArn(
      this,
      "WarningTopic",
      StringParameter.fromStringParameterName(
        this,
        "WarningTopicParam",
        SSM_KEY_WARNING_TOPIC,
      ).stringValue,
    );

    InternalLambdas.create(this, alarmTopic, warningTopic, appProps);
  }
}
