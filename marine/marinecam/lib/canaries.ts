import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { DigitrafficCanaryRole } from "@digitraffic/common/dist/aws/infra/canaries/canary-role";
import { UrlCanary } from "@digitraffic/common/dist/aws/infra/canaries/url-canary";
import { DatabaseCanary } from "@digitraffic/common/dist/aws/infra/canaries/database-canary";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import { Schedule } from "aws-cdk-lib/aws-events";
import { Duration } from "aws-cdk-lib";
import { MobileServerProps } from "./app-props";

export class Canaries {
    constructor(stack: DigitrafficStack, publicApi: DigitrafficRestApi) {
        if (stack.configuration.stackFeatures?.enableCanaries !== false) {
            const dbRole = new DigitrafficCanaryRole(stack, "marinecam-db").withDatabaseAccess();

            if ((stack.configuration as MobileServerProps).enableKeyProtectedApi) {
                const urlRole = new DigitrafficCanaryRole(stack, "marinecam-url");
                UrlCanary.create(stack, urlRole, publicApi, {
                    name: "mc-restricted",
                    schedule: Schedule.rate(Duration.minutes(30)),
                    alarm: {
                        topicArn: stack.configuration.alarmTopicArn
                    }
                });
            }

            DatabaseCanary.createV2(stack, dbRole, "mc");
        }
    }
}
