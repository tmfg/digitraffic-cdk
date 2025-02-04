import type { Construct } from "constructs";
import { DigitrafficStack, type StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { PublicApi } from "./public-api.js";
import { InternalLambdas } from "./internal-lambdas.js";

export class PortCallStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, config: StackConfiguration) {
        super(scope, id, config);

        new InternalLambdas(this);
        new PublicApi(this);
    }
}