import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {Scheduler} from "digitraffic-common/scheduler/scheduler";
import {dbFunctionProps} from "digitraffic-common/stack/lambda-configs";
import {Architecture, AssetCode, Function} from "@aws-cdk/aws-lambda";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {TrafficType} from "digitraffic-common/model/traffictype";
import {createSubscription} from "digitraffic-common/stack/subscription";

export class InternalLambdas {
    constructor(stack: DigitrafficStack, secret: ISecret,) {
        Scheduler.everyMinutes(stack, 'NauticalWarnings-Scheduler', 10, createUpdateNauticalWarningsLambda(stack, secret));
    }
}

function createUpdateNauticalWarningsLambda(stack: DigitrafficStack, secret: ISecret): Function {
    const environment = stack.createDefaultLambdaEnvironment('NauticalWarnings');

    const functionName = 'NauticalWarnings-UpdateNauticalWarnings';
    const lambdaConf = dbFunctionProps(stack, {
        functionName: functionName,
        architecture: Architecture.ARM_64,
        memorySize: 128,
        code: new AssetCode('dist/lambda/update-nautical-warnings'),
        handler: 'update-nautical-warnings.handler',
        environment
    });

    const lambda = MonitoredFunction.create(stack, functionName, lambdaConf, TrafficType.MARINE);
    secret.grantRead(lambda);
    createSubscription(lambda, functionName, stack.configuration.logsDestinationArn, stack);

    return lambda;
}

