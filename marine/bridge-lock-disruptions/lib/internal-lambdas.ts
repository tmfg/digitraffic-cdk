import {Function} from '@aws-cdk/aws-lambda';
import {databaseFunctionProps} from 'digitraffic-common/stack/lambda-configs';
import {DigitrafficLogSubscriptions} from 'digitraffic-common/stack/subscription';
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {Scheduler} from "digitraffic-common/scheduler/scheduler";

export function create(
    secret: ISecret,
    stack: DigitrafficStack): Function {

    const functionName = "BridgeLockDisruption-UpdateDisruptions";
    const environment = stack.createDefaultLambdaEnvironment('BridgeLockDisruption');

    const lambdaConf = databaseFunctionProps(stack, environment, functionName, 'update-disruptions', {
        timeout: 10,
    });

    const updateDisruptionsLambda = MonitoredFunction.create(stack, 'UpdateDisruptions', lambdaConf);

    secret.grantRead(updateDisruptionsLambda);

    Scheduler.everyMinutes(stack, 'UpdateDisruptionsRule', 10, updateDisruptionsLambda);

    new DigitrafficLogSubscriptions(stack, updateDisruptionsLambda);

    return updateDisruptionsLambda;
}
