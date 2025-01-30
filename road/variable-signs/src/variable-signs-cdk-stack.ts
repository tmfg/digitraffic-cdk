import type { Construct } from "constructs";
import {
  DigitrafficStack,
  type StackConfiguration,
} from "@digitraffic/common/dist/aws/infra/stack/stack";
import { IntegrationApi } from "./integration-api.js";
import { PublicApi } from "./public-api.js";
import { Canaries } from "./canaries.js";

export class VariableSignsCdkStack extends DigitrafficStack {
  constructor(
    scope: Construct,
    id: string,
    configuration: StackConfiguration,
  ) {
    super(scope, id, configuration);

    new IntegrationApi(this);
    const publicApi = new PublicApi(this);
    new Canaries(this, publicApi.restApi);
  }
}
