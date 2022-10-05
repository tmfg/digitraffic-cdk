import {DigitrafficStack} from "@digitraffic/common/aws/infra/stack/stack";
import {Construct} from "constructs";
import {NauticalWarningConfiguration} from "./app-props";
import {InternalLambdas} from "./internal-lambdas";
import {PublicApi} from "./public-api";
import {Canaries} from "./canaries";

export class NauticalWarningsStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: NauticalWarningConfiguration) {
        super(scope, id, configuration);

        new InternalLambdas(this);
        const publicApi = new PublicApi(this);
        new Canaries(this, publicApi);
    }
}
