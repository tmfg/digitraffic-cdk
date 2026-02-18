import type { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import type { Construct } from "constructs";
import { Canaries } from "./canaries.js";
import { InternalLambdas } from "./internal-lambdas.js";
import { PublicApiV2 } from "./public-api-v2.js";

export class CountingSiteCdkStack extends DigitrafficStack {
  constructor(scope: Construct, id: string, configuration: StackConfiguration) {
    super(scope, id, configuration);

    // 'this' reference must be passed to all child resources to keep them tied to this stack
    new InternalLambdas(this);
    const publicApiV2 = new PublicApiV2(this);

    new Canaries(this, publicApiV2.publicApi);
  }
}
