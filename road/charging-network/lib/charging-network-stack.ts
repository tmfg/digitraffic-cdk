import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { Construct } from "constructs";
import { ChargingNetworkProps } from "./app-props";
import { IntegrationOcpiApi } from "./integration-ocpi-api";
import { InternalLambdas } from "./internal-lambdas";

export class ChargingNetworkStack extends DigitrafficStack {
    constructor(scope: Construct, id: string, configuration: ChargingNetworkProps) {
        super(scope, id, configuration);

        /*const publicApi = */ new IntegrationOcpiApi(this);
        /*const internalLambdas = */ new InternalLambdas(this);
        // new Canaries(this, publicApi);
    }
}
