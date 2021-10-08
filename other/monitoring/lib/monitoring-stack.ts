import {Construct, Stack, StackProps} from '@aws-cdk/core';
import {Topic} from '@aws-cdk/aws-sns';
import {EmailSubscription} from '@aws-cdk/aws-sns-subscriptions';
import {MonitoringConfiguration} from "./app-props";
import {DigitrafficSecurityRule} from "digitraffic-common/security/security-rule";

export class MonitoringStack extends Stack {
    constructor(scope: Construct, id: string, configuration: MonitoringConfiguration, props?: StackProps) {
        super(scope, id, props);

        const warningsTopic = this.createTopic('digitraffic-warnings', configuration.warningTopicEmail);
        const alarmsTopic = this.createTopic('digitraffic-alarms', configuration.alarmTopicEmail);

        new DigitrafficSecurityRule(this, alarmsTopic);
    }

    createTopic(topicName: string, email: string): Topic {
        const topic = new Topic(this, topicName, {
            topicName
        });

        topic.addSubscription(new EmailSubscription(email));

        return topic;
    }
}
