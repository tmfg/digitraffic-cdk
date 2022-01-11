import {Function} from 'aws-cdk-lib/aws-lambda';
import {databaseFunctionProps} from 'digitraffic-common/aws/infra/stack/lambda-configs';
import {DigitrafficLogSubscriptions} from 'digitraffic-common/aws/infra/stack/subscription';
import {ISecret} from "aws-cdk-lib/aws-secretsmanager";
import {MonitoredFunction} from "digitraffic-common/aws/infra/stack/monitoredfunction";
import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {Scheduler} from "digitraffic-common/aws/infra/scheduler";

export function create(secret: ISecret,
    stack: DigitrafficStack): Function {

    const functionName = "BridgeLockDisruption-UpdateDisruptions";
    const environment = stack.createDefaultLambdaEnvironment('BridgeLockDisruption');

    const lambdaConf = databaseFunctionProps(
        stack, environment, functionName, 'update-disruptions', {
            timeout: 10,
        },
    );

    const updateDisruptionsLambda = MonitoredFunction.create(stack, 'UpdateDisruptions', lambdaConf);

    secret.grantRead(updateDisruptionsLambda);

    Scheduler.everyMinutes(stack, 'UpdateDisruptionsRule', 10, updateDisruptionsLambda);

    new DigitrafficLogSubscriptions(stack, updateDisruptionsLambda);

    return updateDisruptionsLambda;
}
