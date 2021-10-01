import {Construct} from "@aws-cdk/core";
import {InternalLambdas} from "./internal-lambdas";
import {Secret} from "@aws-cdk/aws-secretsmanager";
import {Canaries} from "./canaries";
import {PublicApi} from "./public-api";
import {DigitrafficStack, StackConfiguration} from "digitraffic-common/stack/stack";

export class CountingSitesCdkStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: StackConfiguration) {
        super(scope, id, configuration);

        const secret = Secret.fromSecretNameV2(this, 'CountingSitesSecret', configuration.secretId);

        // 'this' reference must be passed to all child resources to keep them tied to this stack
        new InternalLambdas(this, secret);
        new PublicApi(this, secret);

        new Canaries(this, secret);
    }
}
