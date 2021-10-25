import {DatabaseCanary} from "digitraffic-common/canaries/database-canary";
import {Schedule} from "@aws-cdk/aws-events";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {DigitrafficCanaryRole} from "digitraffic-common/canaries/canary-role";
import {UrlCanary} from "digitraffic-common/canaries/url-canary";
import {DigitrafficRestApi} from "digitraffic-common/api/rest_apis";
import {Duration} from "@aws-cdk/core";

export class Canaries {
    constructor(stack: DigitrafficStack, publicApi: DigitrafficRestApi) {
        if(stack.configuration.enableCanaries) {
            const urlRole = new DigitrafficCanaryRole(stack, 'portactivity-url');
            const dbRole = new DigitrafficCanaryRole(stack, 'counting-sites').withDatabaseAccess();

            DatabaseCanary.create(stack, dbRole, {
                name: 'cs-db',
                alarm: {
                    alarmName: 'CountingSites-Db-Alarm',
                    topicArn: stack.configuration.alarmTopicArn
                }
            });

            UrlCanary.create(stack, urlRole, publicApi, {
                name: 'cs-public',
                schedule: Schedule.rate(Duration.minutes(30)),
                alarm: {
                    alarmName: 'CountingSites-PublicAPI-Alarm',
                    topicArn: stack.configuration.warningTopicArn
                }
            });
        }
    }
}
