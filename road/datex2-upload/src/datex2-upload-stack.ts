import { Construct } from "constructs";
import {
  DigitrafficStack,
  type StackConfiguration,
} from "@digitraffic/common/dist/aws/infra/stack/stack";
import { IntegrationApi } from "./integration-api.js";

export class Datex2UploadStack extends DigitrafficStack {
  constructor(
    scope: Construct,
    id: string,
    configuration: StackConfiguration,
  ) {
    super(scope, id, configuration);

    new IntegrationApi(this);
  }
}
