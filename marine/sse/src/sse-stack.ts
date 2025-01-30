import type { Construct } from "constructs";
import * as IntegrationApi from "./integration-api.js";
import type { AppProps } from "./app-props.js";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";

export class SseStack extends DigitrafficStack {
  constructor(scope: Construct, id: string, appProps: AppProps) {
    super(scope, id, appProps);

    if (this.secret) {
      IntegrationApi.createIntegrationApiAndHandlerLambda(
        this.secret,
        this,
      );
    }
  }
}
