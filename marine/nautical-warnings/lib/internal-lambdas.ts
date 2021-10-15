import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {Scheduler} from "digitraffic-common/scheduler/scheduler";
import {databaseFunctionProps} from "digitraffic-common/stack/lambda-configs";
import {Function} from "@aws-cdk/aws-lambda";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {DigitrafficLogSubscriptions} from "digitraffic-common/stack/subscription";

export class InternalLambdas {
    constructor(stack: DigitrafficStack, secret: ISecret,) {
        Scheduler.everyMinutes(stack, 'NauticalWarnings-Scheduler', 10, createUpdateNauticalWarningsLambda(stack, secret));
    }
}

function createUpdateNauticalWarningsLambda(stack: DigitrafficStack, secret: ISecret): Function {
    const environment = stack.createDefaultLambdaEnvironment('NauticalWarnings');

    const lambdaConf = databaseFunctionProps(stack, environment, 'NauticalWarnings-UpdateNauticalWarnings', 'update-nautical-warnings');
    const lambda = MonitoredFunction.create(stack, 'NauticalWarnings-UpdateNauticalWarnings', lambdaConf);

    secret.grantRead(lambda);
    new DigitrafficLogSubscriptions(stack, lambda);

    return lambda;
}

