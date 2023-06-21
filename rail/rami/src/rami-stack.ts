import { DigitrafficStack, StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack.js";
import type { Construct } from "constructs";
import * as InternalLambdas from "./internal-lambdas.js";

interface RamiConfiguration extends StackConfiguration {
    readonly dlqBucketName: string;
}
export class RamiStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: RamiConfiguration) {
        super(scope, id, configuration);

        InternalLambdas.create(this, configuration.dlqBucketName);
    }
}
