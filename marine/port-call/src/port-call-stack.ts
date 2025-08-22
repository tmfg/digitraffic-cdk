import type { Construct } from "constructs";
import { DigitrafficStack, type StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";
import * as InternalLambdas from "./internal-lambdas.js";

export class PortCallStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, config: StackConfiguration) {
        super(scope, id, config);

        InternalLambdas.create(this);
    }
}