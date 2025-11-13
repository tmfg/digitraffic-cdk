import { Aspects, Stack } from "aws-cdk-lib";
import { Topic } from "aws-cdk-lib/aws-sns";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Effect, PolicyStatement, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import type { MonitoringConfiguration } from "./app-props.js";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";
import { RdsMonitoring } from "./rds-monitoring.js";
import { StackCheckingAspect } from "@digitraffic/common/dist/aws/infra/stack/stack-checking-aspect";
import {
  SSM_KEY_ALARM_TOPIC,
  SSM_KEY_WARNING_TOPIC,
} from "@digitraffic/common/dist/aws/infra/stack/stack";
import { RegionMonitoringStack } from "./region-monitoring-stack.js";
import { EcsMonitoring } from "./ecs-monitoring.js";
import { KmsMonitoring } from "./kms-monitoring.js";

export class MonitoringStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    configuration: MonitoringConfiguration,
  ) {
    super(scope, id, {
      env: configuration.env,
    });

    const alarmsTopic = this.createTopic(
      "digitraffic-monitoring-alarms",
      configuration.alarmTopicEmail,
    );
    const warningsTopic = this.createTopic(
      "digitraffic-monitoring-warnings",
      configuration.warningTopicEmail,
    );

    new StringParameter(this, "AlarmsParam", {
      description: "Alarms topic ARN",
      parameterName: SSM_KEY_ALARM_TOPIC,
      stringValue: alarmsTopic.topicArn,
    });

    new StringParameter(this, "WarningsParam", {
      description: "Warnings topic ARN",
      parameterName: SSM_KEY_WARNING_TOPIC,
      stringValue: warningsTopic.topicArn,
    });

    this.createMonitorings(alarmsTopic, configuration);

    // another stack is created for global monitorings, even if you don't configure them.
    // this is to make sure the rules are removed when you change your configuration to not monitor Route53 or cloudfront data
    this.addDependency(
      new RegionMonitoringStack(scope, id, alarmsTopic, configuration),
    );

    Aspects.of(this).add(new StackCheckingAspect());
  }

  createMonitorings(
    alarmsTopic: Topic,
    configuration: MonitoringConfiguration,
  ): void {
    if (configuration.db) {
      new RdsMonitoring(
        this,
        alarmsTopic,
        configuration.envName,
        configuration.db,
      );
    }

    if (configuration.ecs) {
      new EcsMonitoring(this, alarmsTopic, configuration.ecs);
    }

    new KmsMonitoring(this, alarmsTopic);
  }

  createTopic(topicName: string, email: string): Topic {
    const topic = new Topic(this, topicName, {
      topicName,
    });

    topic.addToResourcePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["SNS:Publish"],
        resources: [topic.topicArn],
        principals: [
          new ServicePrincipal("cloudwatch.amazonaws.com"),
          new ServicePrincipal("events.amazonaws.com"),
          new ServicePrincipal("events.rds.amazonaws.com"),
        ],
        conditions: {
          ArnLike: {
            "aws:SourceArn": [
              `arn:aws:*:*:${this.account}:*:*`,
            ],
          },
          StringEquals: {
            "aws:SourceAccount": this.account,
          },
        },
      }),
    );

    topic.addSubscription(new EmailSubscription(email));

    return topic;
  }
}
