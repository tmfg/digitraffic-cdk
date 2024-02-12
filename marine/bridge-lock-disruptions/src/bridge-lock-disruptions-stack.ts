import type { Construct } from "constructs";
import * as InternalLambdas from "./internal-lambdas.js";
import type { Props } from "./app-props.js";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { PublicApi } from "./public-api.js";

export class BridgeLockDisruptionsStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, appProps: Props) {
        super(scope, id, appProps);

        InternalLambdas.create(this);
        new PublicApi(this);
    }
}
