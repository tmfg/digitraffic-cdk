import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { Construct } from "constructs";
import { InternalLambdas } from "./internal-lambdas";
import { PublicApi } from "./public-api";
import { Canaries } from "./canaries";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";

export type NauticalWarningConfiguration = StackConfiguration & {
    apiKey: string;
};

export class NauticalWarningsStack extends DigitrafficStack {
    readonly secret: ISecret; // override, not optional

    constructor(
        scope: Construct,
        id: string,
        configuration: NauticalWarningConfiguration
    ) {
        super(scope, id, configuration);

        new InternalLambdas(this);
        const publicApi = new PublicApi(this);
        new Canaries(this, publicApi);
    }
}
