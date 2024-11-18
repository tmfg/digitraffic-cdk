import type { Construct } from "constructs";
import { InternalLambdas } from "./internal-lambdas.js";
import { Canaries } from "./canaries.js";
import { PublicApiV2 } from "./public-api-v2.js";
import {
    DigitrafficStack,
    type StackConfiguration,
} from "@digitraffic/common/dist/aws/infra/stack/stack";

export class CountingSiteCdkStack extends DigitrafficStack {
    constructor(
        scope: Construct,
        id: string,
        configuration: StackConfiguration
    ) {
        super(scope, id, configuration);

        // 'this' reference must be passed to all child resources to keep them tied to this stack
        new InternalLambdas(this);
        const publicApiV2 = new PublicApiV2(this);

        new Canaries(this, publicApiV2.publicApi);
    }
}
