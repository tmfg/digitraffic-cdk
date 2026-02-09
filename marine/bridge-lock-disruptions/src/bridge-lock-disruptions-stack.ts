import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import type { Construct } from "constructs";
import type { BridgeLockDisruptionsProps, Props } from "./app-props.js";
import * as InternalLambdas from "./internal-lambdas.js";
import { PublicApi } from "./public-api.js";

export class BridgeLockDisruptionsStack extends DigitrafficStack {
  constructor(
    scope: Construct,
    id: string,
    appProps: Props,
    bridgeLockDisruptionsProps: BridgeLockDisruptionsProps,
  ) {
    super(scope, id, appProps);

    InternalLambdas.create(this);
    new PublicApi(this, bridgeLockDisruptionsProps);
  }
}
