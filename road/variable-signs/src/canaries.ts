import { DigitrafficCanaryRole } from "@digitraffic/common/dist/aws/infra/canaries/canary-role";
import { DatabaseCanary } from "@digitraffic/common/dist/aws/infra/canaries/database-canary";
import { UrlCanary } from "@digitraffic/common/dist/aws/infra/canaries/url-canary";
import type { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest-api";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { Duration } from "aws-cdk-lib";
import { Schedule } from "aws-cdk-lib/aws-events";

export class Canaries {
  constructor(stack: DigitrafficStack, publicApi: DigitrafficRestApi) {
    if (stack.configuration.stackFeatures?.enableCanaries) {
      const urlRole = new DigitrafficCanaryRole(stack, "vs-url");
      const dbRole = new DigitrafficCanaryRole(
        stack,
        "vs-db",
      ).withDatabaseAccess();

      DatabaseCanary.createV2(stack, dbRole, "vs");

      UrlCanary.create(stack, urlRole, publicApi, {
        name: "vs-public",
        schedule: Schedule.rate(Duration.minutes(30)),
        alarm: {
          alarmName: "VariableSigns-PublicAPI-Alarm",
          topicArn: stack.configuration.alarmTopicArn,
        },
      });
    }
  }
}
