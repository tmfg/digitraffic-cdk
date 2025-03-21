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

    PublicApi.create(secret, appProps, this);
  }
}
