import type { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import type { Construct } from "constructs";
import { InternalLambdas } from "./internal-lambdas.js";
import { PublicApi } from "./public-api.js";

export interface PortCallConfiguration extends StackConfiguration {
  readonly enableUpdate: boolean;
}

export class PortCallStack extends DigitrafficStack {
  constructor(scope: Construct, id: string, config: PortCallConfiguration) {
    super(scope, id, config);

    new InternalLambdas(this, config.enableUpdate);
    new PublicApi(this);
  }
}
