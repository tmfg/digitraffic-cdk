import type { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import type { Construct } from "constructs";
import { InternalLambdas } from "./internal-lambdas.js";
import { PublicApi } from "./public-api.js";

export class PortCallStack extends DigitrafficStack {
  constructor(scope: Construct, id: string, config: StackConfiguration) {
    super(scope, id, config);

    new InternalLambdas(this);
    new PublicApi(this);
  }
}
