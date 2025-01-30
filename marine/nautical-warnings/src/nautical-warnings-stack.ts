import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import type { Construct } from "constructs";
import { InternalLambdas } from "./internal-lambdas.js";
import { PublicApi } from "./public-api.js";
import { Canaries } from "./canaries.js";
import type { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import type { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";

export type NauticalWarningConfiguration = StackConfiguration & {
  apiKey: string;
};

export class NauticalWarningsStack extends DigitrafficStack {
  declare readonly secret: ISecret; // override, not optional

  constructor(
    scope: Construct,
    id: string,
    configuration: NauticalWarningConfiguration,
  ) {
    super(scope, id, configuration);

    new InternalLambdas(this);
    const publicApi = new PublicApi(this);
    new Canaries(this, publicApi);
  }
}
