import { Construct } from "constructs";
import { PublicApi } from "./public-api";
import {
    DigitrafficStack,
    StackConfiguration,
} from "@digitraffic/common/dist/aws/infra/stack/stack";

export class RoadNetworkConditionsStack extends DigitrafficStack {
    constructor(
        scope: Construct,
        id: string,
        configuration: StackConfiguration
    ) {
        super(scope, id, configuration);

        // 'this' reference must be passed to all child resources to keep them tied to this stack
        new PublicApi(this);
    }
}
