import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { UrlCanary } from "@digitraffic/common/dist/aws/infra/canaries/url-canary";
import { DigitrafficCanaryRole } from "@digitraffic/common/dist/aws/infra/canaries/canary-role";
import type { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";

export class Canaries {
  constructor(stack: DigitrafficStack, publicApi: DigitrafficRestApi) {
    if (stack.configuration.stackFeatures?.enableCanaries ?? true) {
      const urlRole = new DigitrafficCanaryRole(stack, "aton-url");

      UrlCanary.create(stack, urlRole, publicApi, {
        name: "aton-public",
        handler: "public-api.handler",
        alarm: {
          alarmName: "ATON-PublicAPI-Alarm",
          topicArn: stack.configuration.warningTopicArn,
        },
      });
    }
  }
}
