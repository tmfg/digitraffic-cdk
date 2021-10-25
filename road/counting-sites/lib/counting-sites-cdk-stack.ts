import {Construct} from "@aws-cdk/core";
import {InternalLambdas} from "./internal-lambdas";
import {Canaries} from "./canaries";
import {PublicApi} from "./public-api";
import {DigitrafficStack, StackConfiguration} from "digitraffic-common/stack/stack";

export class CountingSitesCdkStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: StackConfiguration) {
        super(scope, id, configuration);

        // 'this' reference must be passed to all child resources to keep them tied to this stack
        new InternalLambdas(this);
        const publicApi = new PublicApi(this);

        new Canaries(this, publicApi.publicApi);
    }
}
