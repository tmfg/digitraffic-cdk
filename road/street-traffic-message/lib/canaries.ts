import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {DigitrafficRestApi} from "digitraffic-common/aws/infra/stack/rest_apis";
import {DigitrafficCanaryRole} from "digitraffic-common/aws/infra/canaries/canary-role";
import {DatabaseCanary} from "digitraffic-common/aws/infra/canaries/database-canary";
import {UrlCanary} from "digitraffic-common/aws/infra/canaries/url-canary";
import {Schedule} from "aws-cdk-lib/aws-events";
import {Duration} from "aws-cdk-lib";

export class Canaries {
    constructor(stack: DigitrafficStack, publicApi: DigitrafficRestApi) {
        if (stack.configuration.enableCanaries) {
            const urlRole = new DigitrafficCanaryRole(stack, 'stm-url');
            const dbRole = new DigitrafficCanaryRole(stack, 'stm-db').withDatabaseAccess();

            DatabaseCanary.createV2(stack, dbRole, 'stm');

            UrlCanary.create(stack, urlRole, publicApi, {
                name: 'stm-public',
                schedule: Schedule.rate(Duration.minutes(30)),
                alarm: {
                    alarmName: 'STM-PublicAPI-Alarm',
                    topicArn: stack.configuration.alarmTopicArn,
                },
            });

        }
    }

}
