import {DigitrafficCanaryRole} from "digitraffic-common/canaries/canary";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {UrlCanary} from "digitraffic-common/canaries/url-canary";

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
        }
    }
}