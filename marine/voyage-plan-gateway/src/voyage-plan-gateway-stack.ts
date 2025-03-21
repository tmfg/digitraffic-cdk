import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";
import type { VoyagePlanGatewayProps } from "./app-props.js";
import * as PublicApi from "./public-api.js";

export class VoyagePlanGatewayStack extends DigitrafficStack {
  constructor(scope: Construct, id: string, appProps: VoyagePlanGatewayProps) {
    super(scope, id, appProps);

    const secret = Secret.fromSecretNameV2(
      this,
      "VPGWSecret",
      appProps.secretId,
    );

    /**
     * The VIS API is no longer in operation so there are no more voyage plans to handle.

    const notifyTopicName = "VPGW-NotifyTopic";
    const notifyTopic = new Topic(this, notifyTopicName, {
      topicName: notifyTopicName,
      displayName: notifyTopicName,
    });

    IntegrationApi.create(secret, notifyTopic, appProps, this);
    InternalLambdas.create(secret, notifyTopic, appProps, this);
     */

    // The schedules public API is still needed
    PublicApi.create(secret, appProps, this);
  }
}
