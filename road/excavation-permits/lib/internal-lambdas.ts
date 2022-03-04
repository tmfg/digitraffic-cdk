import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {Scheduler} from "digitraffic-common/aws/infra/scheduler";
import {MonitoredDBFunction, MonitoredFunction} from "digitraffic-common/aws/infra/stack/monitoredfunction";

export class InternalLambdas {
    constructor(stack: DigitrafficStack) {
        const updatePermitsLambdaForLahti = InternalLambdas.createUpdatePermitsLambda(stack, 'lahti');

        Scheduler.everyHour(stack, 'RuleForPermitUpdateForLahti', updatePermitsLambdaForLahti);
    }

    private static createUpdatePermitsLambda(stack: DigitrafficStack, permitDomain: string): MonitoredFunction {
        const lambdaEnvironment = stack.createLambdaEnvironment();
        lambdaEnvironment.PERMIT_DOMAIN = permitDomain;

        return MonitoredDBFunction.create(stack, 'update-permits', lambdaEnvironment, {
            memorySize: 512,
            functionName: 'ExcavationPermits-UpdatePermits-' + permitDomain,
        });
    }
}
