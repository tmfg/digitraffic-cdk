import { DigitrafficLogSubscriptions } from "@digitraffic/common/dist/aws/infra/stack/subscription";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";

export function create(stack: DigitrafficStack) {
    const updateLambda = createUpdateLightsLambda(stack);

    stack.grantSecret(updateLambda);
    new DigitrafficLogSubscriptions(stack, updateLambda);

    Scheduler.everyMinute(stack, "Shiplight-Scheduler", updateLambda);
}

function createUpdateLightsLambda(stack: DigitrafficStack): MonitoredFunction {
    const environment = stack.createLambdaEnvironment();

    return MonitoredFunction.createV2(stack, "update-lights", environment, {
        singleLambda: true,
        timeout: 30,
    });
}
