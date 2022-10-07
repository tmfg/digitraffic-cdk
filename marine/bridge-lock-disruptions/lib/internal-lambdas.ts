import {
    MonitoredDBFunction,
    MonitoredFunction,
} from "@digitraffic/common/aws/infra/stack/monitoredfunction";
import { DigitrafficStack } from "@digitraffic/common/aws/infra/stack/stack";
import { Scheduler } from "@digitraffic/common/aws/infra/scheduler";

export function create(stack: DigitrafficStack): MonitoredFunction {
    const environment = stack.createDefaultLambdaEnvironment(
        "BridgeLockDisruption"
    );

    const updateDisruptionsLambda = MonitoredDBFunction.create(
        stack,
        "update-disruptions",
        environment,
        {
            timeout: 10,
        }
    );

    Scheduler.everyMinutes(
        stack,
        "UpdateDisruptionsRule",
        10,
        updateDisruptionsLambda
    );

    return updateDisruptionsLambda;
}
