import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {UrlCanary} from "digitraffic-common/canaries/url-canary";
import {DatabaseCanary} from "digitraffic-common/canaries/database-canary";
import {DigitrafficCanaryRole} from "digitraffic-common/canaries/canary-role";

export class Canaries {
    constructor(stack: DigitrafficStack, secret: ISecret) {
        if(stack.configuration.enableCanaries) {
            const urlRole = new DigitrafficCanaryRole(stack, 'aton-url');
            const dbRole = new DigitrafficCanaryRole(stack, 'aton-db').withDatabaseAccess();

            new UrlCanary(stack, urlRole, {
                name: 'aton-public',
                hostname: "meri-test.digitraffic.fi",
                handler: 'public-api.handler',
                alarm: {
                    alarmName: 'ATON-PublicAPI-Alarm',
                    topicArn: stack.configuration.warningTopicArn
                }
            });

            new DatabaseCanary(stack, dbRole, secret, {
                name: 'aton',
                secret: stack.configuration.secretId,
                handler: 'db.handler',
                alarm: {
                    alarmName: 'ATON-Db-Alarm',
                    topicArn: stack.configuration.warningTopicArn
                }
            });
        }
    }
}