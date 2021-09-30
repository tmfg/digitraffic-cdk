import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {createCanaryRole} from "digitraffic-common/canaries/canary";
import {DatabaseCanary} from "digitraffic-common/canaries/database-canary";
import {Schedule} from "@aws-cdk/aws-events";
import {DigitrafficStack} from "digitraffic-common/stack/stack";

export class Canaries {
    constructor(stack: DigitrafficStack, secret: ISecret) {
        if(stack.configuration.enableCanaries) {
            const role = createCanaryRole(stack, 'counting-sites');

            new DatabaseCanary(stack, role, secret, {
                name: 'counting-sites',
                secret: stack.configuration.secretId,
                schedule: Schedule.expression("cron(0/15 2-19 ? * MON-SUN *)"),
                handler: 'db.handler',
                alarm: {
                    alarmName: 'CountingSites-Db-Alarm',
                    topicArn: stack.configuration.alarmTopicArn
                }
            });
        }
    }
}
