import {
  DigitrafficStack,
  type StackConfiguration,
} from "@digitraffic/common/dist/aws/infra/stack/stack";
import type { Construct } from "constructs";
import * as InternalLambdas from "./internal-lambdas.js";
import * as PublicApi from "./public-api.js";

export class WinterNavigationStack extends DigitrafficStack {
  constructor(scope: Construct, id: string, configuration: StackConfiguration) {
    super(scope, id, configuration);

    InternalLambdas.create(this);
    const publicApi = PublicApi.create(this);

    publicApi.exportEndpoint();
  }
}
