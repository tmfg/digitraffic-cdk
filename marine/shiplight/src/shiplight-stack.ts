import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { type Construct } from "constructs";
import type { ShiplightProps } from "./app-props.js";
import * as InternalLambdas from "./internal-lambdas.js";

export class ShiplightStack extends DigitrafficStack {
  constructor(scope: Construct, id: string, appProps: ShiplightProps) {
    super(scope, id, appProps);

    InternalLambdas.create(this);
  }
}
