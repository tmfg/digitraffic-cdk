import type { Construct } from "constructs";
import * as IntegrationApi from "./integration-api.js";
import * as InternalLambdas from "./internal-lambdas.js";
import * as PublicApi from "./public-api.js";
import type { VoyagePlanGatewayProps } from "./app-props.js";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Topic } from "aws-cdk-lib/aws-sns";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";

export class VoyagePlanGatewayStack extends DigitrafficStack {
  constructor(scope: Construct, id: string, appProps: VoyagePlanGatewayProps) {
    super(scope, id, appProps);

    const secret = Secret.fromSecretNameV2(
      this,
      "VPGWSecret",
      appProps.secretId,
    );

    const notifyTopicName = "VPGW-NotifyTopic";
    const notifyTopic = new Topic(this, notifyTopicName, {
      topicName: notifyTopicName,
      displayName: notifyTopicName,
    });

    IntegrationApi.create(secret, notifyTopic, appProps, this);
    InternalLambdas.create(secret, notifyTopic, appProps, this);
    PublicApi.create(secret, appProps, this);
  }
}
