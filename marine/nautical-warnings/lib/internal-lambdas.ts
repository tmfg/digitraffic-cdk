import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {Scheduler} from "digitraffic-common/scheduler/scheduler";
import {databaseFunctionProps} from "digitraffic-common/stack/lambda-configs";
import {Function} from "@aws-cdk/aws-lambda";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {DigitrafficLogSubscriptions} from "digitraffic-common/stack/subscription";

export class InternalLambdas {
    constructor(stack: DigitrafficStack) {
        Scheduler.everyMinutes(stack, 'NauticalWarnings-Scheduler', 10, createUpdateNauticalWarningsLambda(stack));
    }
}

function createUpdateNauticalWarningsLambda(stack: DigitrafficStack): Function {
    const environment = stack.createLambdaEnvironment();
    const lambda = MonitoredFunction.createV2(stack, 'update-nautical-warnings', environment);

    stack.grantSecret(lambda);
    new DigitrafficLogSubscriptions(stack, lambda);

    return lambda;
}

