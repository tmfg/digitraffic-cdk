import {
    MonitoredDBFunction,
    type MonitoredFunction
} from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";

export function create(stack: DigitrafficStack): MonitoredFunction {
    const environment = stack.createDefaultLambdaEnvironment("BridgeLockDisruption");

    const updateDisruptionsLambda = MonitoredDBFunction.create(stack, "update-disruptions", environment, {
        timeout: 10
    });

    Scheduler.everyMinutes(stack, "UpdateDisruptionsRule", 10, updateDisruptionsLambda);

    return updateDisruptionsLambda;
}
