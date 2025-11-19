import { DigitrafficCanaryRole } from "@digitraffic/common/dist/aws/infra/canaries/canary-role";
import { DatabaseCanary } from "@digitraffic/common/dist/aws/infra/canaries/database-canary";
import { UrlCanary } from "@digitraffic/common/dist/aws/infra/canaries/url-canary";
import type { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest-api";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { Duration } from "aws-cdk-lib";
import { Schedule } from "aws-cdk-lib/aws-events";

export class Canaries {
  constructor(stack: DigitrafficStack, publicApi: DigitrafficRestApi) {
    if (stack.configuration.stackFeatures?.enableCanaries ?? true) {
      const urlRole = new DigitrafficCanaryRole(stack, "cs-url");
      const dbRole = new DigitrafficCanaryRole(
        stack,
        "cs-db",
      ).withDatabaseAccess();

      DatabaseCanary.createV2(stack, dbRole, "cs");

      UrlCanary.create(stack, urlRole, publicApi, {
        name: "cs-public",
        schedule: Schedule.rate(Duration.minutes(30)),
        alarm: {
          alarmName: "CountingSites-PublicAPI-Alarm",
          topicArn: stack.configuration.alarmTopicArn,
        },
      });
    }
  }
}
