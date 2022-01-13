import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {ISecret} from "aws-cdk-lib/aws-secretsmanager";
import {Scheduler} from "digitraffic-common/aws/infra/scheduler";
import {databaseFunctionProps} from "digitraffic-common/aws/infra/stack/lambda-configs";
import {Function} from "aws-cdk-lib/aws-lambda";
import {MonitoredDBFunction, MonitoredFunction} from "digitraffic-common/aws/infra/stack/monitoredfunction";
import {DigitrafficLogSubscriptions} from "digitraffic-common/aws/infra/stack/subscription";

export class InternalLambdas {
    constructor(stack: DigitrafficStack) {
        Scheduler.everyMinutes(stack, 'NauticalWarnings-Scheduler', 10, createUpdateNauticalWarningsLambda(stack));
    }
}

function createUpdateNauticalWarningsLambda(stack: DigitrafficStack): Function {
    return MonitoredDBFunction.create(stack, 'update-nautical-warnings');
}

