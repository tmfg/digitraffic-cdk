import { Construct } from "constructs";
import { InternalLambdasCdk } from "./internal-lambdas.cdk";
import { DigitrafficStack, StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { Canaries } from "./canaries";

export class MaintenanceTrackingMunicipalityCdkStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: StackConfiguration) {
        super(scope, id, configuration);

        // 'this' reference must be passed to all child resources to keep them tied to this stack
        new InternalLambdasCdk(this);
        new Canaries(this);
    }
}
