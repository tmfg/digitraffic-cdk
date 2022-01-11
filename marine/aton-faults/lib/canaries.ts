import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {UrlCanary} from "digitraffic-common/aws/canaries/url-canary";
import {DatabaseCanary} from "digitraffic-common/aws/canaries/database-canary";
import {DigitrafficCanaryRole} from "digitraffic-common/aws/canaries/canary-role";
import {DigitrafficRestApi} from "digitraffic-common/api/rest_apis";

export class Canaries {
    constructor(stack: DigitrafficStack, publicApi: DigitrafficRestApi) {
        if (stack.configuration.enableCanaries) {
            const urlRole = new DigitrafficCanaryRole(stack, 'aton-url');
            const dbRole = new DigitrafficCanaryRole(stack, 'aton-db').withDatabaseAccess();

            UrlCanary.create(stack, urlRole, publicApi, {
                name: 'aton-public',
                handler: 'public-api.handler',
                alarm: {
                    alarmName: 'ATON-PublicAPI-Alarm',
                    topicArn: stack.configuration.warningTopicArn,
                },
            });

            DatabaseCanary.createV2(stack, dbRole, 'aton');
        }
    }
}