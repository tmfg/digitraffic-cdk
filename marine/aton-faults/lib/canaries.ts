import {DigitrafficCanaryRole} from "digitraffic-common/canaries/canary";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {UrlCanary} from "digitraffic-common/canaries/url-canary";
import {DatabaseCanary} from "digitraffic-common/canaries/database-canary";

export class Canaries {
    constructor(stack: DigitrafficStack, secret: ISecret) {
        if(stack.configuration.enableCanaries) {
            const role = new DigitrafficCanaryRole(stack, 'counting-sites');

            new UrlCanary(stack, role, {
                name: 'aton-public',
                hostname: "meri-test.digitraffic.fi",
                handler: 'public-api.handler',
                alarm: {
                    alarmName: 'ATON-PublicAPI-Alarm',
                    topicArn: stack.configuration.warningTopicArn
                }
            });

            new DatabaseCanary(stack, role, secret, {
                name: 'aton',
                secret: stack.configuration.secretId,
                handler: 'db.handler',
                alarm: {
                    alarmName: 'Aton-Db-Alarm',
                    topicArn: stack.configuration.warningTopicArn
                }
            });
        }
    }
}