import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import type { Construct } from "constructs";
import type { AtonProps } from "./app-props.js";
import { Canaries } from "./canaries.js";
import * as InternalLambdas from "./internal-lambdas.js";
import * as PublicApi from "./public-api.js";

export class AtonFaultsStack extends DigitrafficStack {
  constructor(scope: Construct, id: string, configuration: AtonProps) {
    super(scope, id, configuration);

    InternalLambdas.create(this);

    const publicApi = PublicApi.create(this);
    publicApi.exportEndpoint();

    new Canaries(this, publicApi);
  }
}
