import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import type { Construct } from "constructs";
import type { ChargingNetworkProps } from "./app-props.js";
import { IntegrationOcpiApi } from "./integration-ocpi-api.js";
import { InternalLambdas } from "./internal-lambdas.js";

export class ChargingNetworkStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: ChargingNetworkProps) {
        super(scope, id, configuration);

        new IntegrationOcpiApi(this);
        new InternalLambdas(this);
        // new Canaries(this, publicApi);
    }
}
