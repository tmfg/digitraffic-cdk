import type { Construct } from "constructs";
import { InternalLambdas } from "./internal-lambdas.js";
import { Canaries } from "./canaries.js";
import { PublicApi } from "./public-api.js";
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
        const publicApi = new PublicApi(this);

        new Canaries(this, publicApi.publicApi);
    }
}
