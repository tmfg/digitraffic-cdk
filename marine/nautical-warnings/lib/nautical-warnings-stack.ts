import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { Construct } from "constructs";
import { NauticalWarningConfiguration } from "./app-props";
import { InternalLambdas } from "./internal-lambdas";
import { PublicApi } from "./public-api";
import { Canaries } from "./canaries";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";

export class NauticalWarningsStack extends DigitrafficStack {
    readonly secret: ISecret;

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
