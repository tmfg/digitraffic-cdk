import { Aspects, Stack } from "aws-cdk-lib";
import { Topic } from "aws-cdk-lib/aws-sns";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import * as iam from 'aws-cdk-lib/aws-iam';
import { MonitoringConfiguration } from "./app-props";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { RdsMonitoring } from "./rds-monitoring";
import { StackCheckingAspect } from "@digitraffic/common/dist/aws/infra/stack/stack-checking-aspect";
import { SSM_KEY_ALARM_TOPIC, SSM_KEY_WARNING_TOPIC } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { RegionMonitoringStack } from "./region-monitoring-stack";

export class MonitoringStack extends Stack {
    constructor(scope: Construct, id: string, configuration: MonitoringConfiguration) {
        super(scope, id, {
            env: configuration.env
        });

        const alarmsTopic = this.createTopic("digitraffic-monitoring-alarms", configuration.alarmTopicEmail);
        const warningsTopic = this.createTopic(
            "digitraffic-monitoring-warnings",
            configuration.warningTopicEmail
        );

        new StringParameter(this, "AlarmsParam", {
            description: "Alarms topic ARN",
            parameterName: SSM_KEY_ALARM_TOPIC,
            stringValue: alarmsTopic.topicArn
        });

        new StringParameter(this, "WarningsParam", {
            description: "Warnings topic ARN",
            parameterName: SSM_KEY_WARNING_TOPIC,
            stringValue: warningsTopic.topicArn
        });

        this.createMonitorings(alarmsTopic, configuration);

        // another stack is created for global monitorings, even if you don't configure them.
        // this is to make sure the rules are removed when you change your configuration to not monitor Route53 or cloudfront data
        this.addDependency(new RegionMonitoringStack(scope, id, alarmsTopic, configuration));

        Aspects.of(this).add(new StackCheckingAspect());
    }

    createMonitorings(alarmsTopic: Topic, configuration: MonitoringConfiguration): void {
        if (configuration.db) {
            new RdsMonitoring(this, alarmsTopic, configuration.db);
        }
    }

    createTopic(topicName: string, email: string): Topic {
        const topic = new Topic(this, topicName, {
            topicName
        });

        topic.addToResourcePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["SNS:Publish"],
            resources: [topic.topicArn],
            principals: [
                new iam.ServicePrincipal("cloudwatch.amazonaws.com")
            ],
            conditions: {
                "ArnLike": {
                    "aws:SourceArn": `arn:aws:cloudwatch:${this.region}:${this.account}:alarm:*`
                },
                "StringEquals": {
                    "aws:SourceAccount": this.account
                }
            }
        }));

        topic.addSubscription(new EmailSubscription(email));

        return topic;
    }
}
