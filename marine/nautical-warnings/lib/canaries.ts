import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {DigitrafficCanaryRole} from "digitraffic-common/canaries/canary-role";
import {DatabaseCanary} from "digitraffic-common/canaries/database-canary";
import {UrlCanary} from "digitraffic-common/canaries/url-canary";

export class Canaries {
    constructor(stack: DigitrafficStack, secret: ISecret) {
        if(stack.configuration.enableCanaries) {
            const urlRole = new DigitrafficCanaryRole(stack, 'nw-url');
            const dbRole = new DigitrafficCanaryRole(stack, 'nw-db').withDatabaseAccess();

            new UrlCanary(stack, urlRole, {
                name: 'nw-public',
                hostname: "meri-test.digitraffic.fi",
                handler: 'public-api.handler',
                alarm: {
                    alarmName: 'NW-PublicAPI-Alarm',
                    topicArn: stack.configuration.warningTopicArn
                }
            });

            new DatabaseCanary(stack, dbRole, secret, {
                name: 'nw',
                secret: stack.configuration.secretId,
                handler: 'db.handler',
                alarm: {
                    alarmName: 'NW-Db-Alarm',
                    topicArn: stack.configuration.warningTopicArn
                }
            });

        }
    }
}