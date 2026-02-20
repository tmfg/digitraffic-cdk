import type { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import type { Construct } from "constructs";
import { Canaries } from "./canaries.js";
import { IntegrationApi } from "./integration-api.js";
import { PublicApi } from "./public-api.js";

export class VariableSignsCdkStack extends DigitrafficStack {
  constructor(scope: Construct, id: string, configuration: StackConfiguration) {
    super(scope, id, configuration);

    new IntegrationApi(this);
    const publicApi = new PublicApi(this);
    publicApi.restApi.exportEndpoint();
    new Canaries(this, publicApi.restApi);
  }
}
