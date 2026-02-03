import type { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import type { Construct } from "constructs";
import { Canaries } from "./canaries.js";
import { InternalLambdasCdk } from "./internal-lambdas.cdk.js";

export class MaintenanceTrackingMunicipalityCdkStack extends DigitrafficStack {
  constructor(scope: Construct, id: string, configuration: StackConfiguration) {
    super(scope, id, configuration);

    // 'this' reference must be passed to all child resources to keep them tied to this stack
    new InternalLambdasCdk(this);
    new Canaries(this);
  }
}
