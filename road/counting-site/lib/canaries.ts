import { DatabaseCanary } from "@digitraffic/common/dist/aws/infra/canaries/database-canary";
import { Schedule } from "aws-cdk-lib/aws-events";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { DigitrafficCanaryRole } from "@digitraffic/common/dist/aws/infra/canaries/canary-role";
import { UrlCanary } from "@digitraffic/common/dist/aws/infra/canaries/url-canary";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import { Duration } from "aws-cdk-lib";

export class Canaries {
    constructor(stack: DigitrafficStack, publicApi: DigitrafficRestApi) {
        // if (stack.configuration.stackFeatures?.enableCanaries) {
        const urlRole = new DigitrafficCanaryRole(stack, "cs-url");
        const dbRole = new DigitrafficCanaryRole(stack, "cs-db").withDatabaseAccess();

        DatabaseCanary.createV2(stack, dbRole, "cs");

        UrlCanary.create(stack, urlRole, publicApi, {
            name: "cs-public",
            schedule: Schedule.rate(Duration.minutes(30)),
            alarm: {
                alarmName: "CountingSites-PublicAPI-Alarm",
                topicArn: stack.configuration.alarmTopicArn
            }
        });
        // }
    }
}
