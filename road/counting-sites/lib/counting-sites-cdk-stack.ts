import {Construct, StackProps} from "@aws-cdk/core";
import {InternalLambdas} from "./internal-lambdas";
import {Secret} from "@aws-cdk/aws-secretsmanager";
import {Canaries} from "./canaries";
import {PublicApi} from "./public-api";
import {DigitrafficStack, StackConfiguration} from "digitraffic-common/stack/stack";

export class CountingSitesCdkStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, appProps: StackConfiguration, props?: StackProps) {
        super(scope, id, appProps, props);

        const secret = Secret.fromSecretNameV2(this, 'CountingSitesSecret', appProps.secretId);

        // 'this' reference must be passed to all child resources to keep them tied to this stack
        new InternalLambdas(this, secret);
        new PublicApi(this, secret);

        new Canaries(this, secret);
    }
}
