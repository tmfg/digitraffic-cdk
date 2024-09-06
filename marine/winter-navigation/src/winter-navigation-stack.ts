import { DigitrafficStack, type StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";
import type { Construct } from "constructs";
import * as InternalLambdas from "./internal-lambdas.js";

export class WinterNavigationStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: StackConfiguration) {
        super(scope, id, configuration);

        InternalLambdas.create(this);
    }
}
