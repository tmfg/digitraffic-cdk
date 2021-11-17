import {DigitrafficLogSubscriptions} from 'digitraffic-common/stack/subscription';
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {Scheduler} from "digitraffic-common/scheduler/scheduler";

export function create(stack: DigitrafficStack) {
    const updateLambda = createUpdateLightsLambda(stack);

    stack.grantSecret(updateLambda);
    new DigitrafficLogSubscriptions(stack, updateLambda);

    Scheduler.everyMinute(stack, 'Shiplight-Scheduler', updateLambda);
}

function createUpdateLightsLambda(stack: DigitrafficStack): MonitoredFunction {
    const environment = stack.createLambdaEnvironment();

    return MonitoredFunction.createV2(stack, 'update-lights', environment, {
      singleLambda: true,
      timeout: 30
    });
}
