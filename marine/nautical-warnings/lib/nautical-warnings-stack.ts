import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {Construct} from "@aws-cdk/core";
import {Secret} from "@aws-cdk/aws-secretsmanager";
import {NauticalWarningConfiguration} from "./app-props";
import {InternalLambdas} from "./internal-lambdas";
import {PublicApi} from "./public-api";
import {Canaries} from "./canaries";

export class NauticalWarningsStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: NauticalWarningConfiguration) {
        super(scope, id, configuration);

        const secret = Secret.fromSecretNameV2(this, 'NauticalWarningSecret', configuration.secretId);

        new InternalLambdas(this, secret);
        new PublicApi(this, secret);
        new Canaries(this, secret);
    }
}
