import { DigitrafficStack } from "@digitraffic/common/aws/infra/stack/stack";
import { Scheduler } from "@digitraffic/common/aws/infra/scheduler";
import {
    MonitoredDBFunction,
    MonitoredFunction,
} from "@digitraffic/common/aws/infra/stack/monitoredfunction";

export class InternalLambdas {
    constructor(stack: DigitrafficStack) {
        Scheduler.everyMinutes(
            stack,
            "NauticalWarnings-Scheduler",
            10,
            createUpdateNauticalWarningsLambda(stack)
        );
    }
}

function createUpdateNauticalWarningsLambda(
    stack: DigitrafficStack
): MonitoredFunction {
    return MonitoredDBFunction.create(stack, "update-nautical-warnings");
}
