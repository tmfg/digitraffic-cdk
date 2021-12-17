import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {ISecret} from "aws-cdk-lib/aws-secretsmanager";
import {Scheduler} from "digitraffic-common/scheduler/scheduler";
import {databaseFunctionProps} from "digitraffic-common/stack/lambda-configs";
import {Function} from "aws-cdk-lib/aws-lambda";
import {MonitoredDBFunction, MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {DigitrafficLogSubscriptions} from "digitraffic-common/stack/subscription";

export class InternalLambdas {
    constructor(stack: DigitrafficStack) {
        Scheduler.everyMinutes(stack, 'NauticalWarnings-Scheduler', 10, createUpdateNauticalWarningsLambda(stack));
    }
}

function createUpdateNauticalWarningsLambda(stack: DigitrafficStack): Function {
    return MonitoredDBFunction.create(stack, 'update-nautical-warnings');
}

