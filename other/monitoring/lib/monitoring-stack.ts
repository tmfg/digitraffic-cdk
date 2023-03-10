import { Aspects, Stack } from "aws-cdk-lib";
import { Topic } from "aws-cdk-lib/aws-sns";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { MonitoringConfiguration } from "./app-props";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { RdsMonitoring } from "./rds-monitoring";
import { MqttMonitoring } from "./mqtt-monitoring";
import { StackCheckingAspect } from "@digitraffic/common/dist/aws/infra/stack/stack-checking-aspect";
import {
    SSM_KEY_ALARM_TOPIC,
    SSM_KEY_WARNING_TOPIC,
} from "@digitraffic/common/dist/aws/infra/stack/stack";
import { RegionMonitoringStack } from "./region-monitoring-stack";

export class MonitoringStack extends Stack {
    constructor(
        scope: Construct,
        id: string,
        configuration: MonitoringConfiguration
    ) {
        super(scope, id, {
            env: configuration.env,
        });

        const alarmsTopic = this.createTopic(
            "digitraffic-monitoring-alarms",
            configuration.alarmTopicEmail
        );
        const warningsTopic = this.createTopic(
            "digitraffic-monitoring-warnings",
            configuration.warningTopicEmail
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
            new RegionMonitoringStack(scope, id, alarmsTopic, configuration)
        );

        Aspects.of(this).add(new StackCheckingAspect());
    }

    createMonitorings(
        alarmsTopic: Topic,
        configuration: MonitoringConfiguration
    ) {
        if (configuration.db) {
            new RdsMonitoring(this, alarmsTopic, configuration.db);
        }

        if (configuration.mqtt) {
            new MqttMonitoring(this, alarmsTopic, configuration.mqtt);
        }
    }

    createTopic(topicName: string, email: string): Topic {
        const topic = new Topic(this, topicName, {
            topicName,
        });

        topic.addSubscription(new EmailSubscription(email));

        return topic;
    }
}
