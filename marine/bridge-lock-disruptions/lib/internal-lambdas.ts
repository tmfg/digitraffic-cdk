import {Rule, Schedule} from '@aws-cdk/aws-events';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';
import {Duration} from '@aws-cdk/core';
import {dbFunctionProps} from 'digitraffic-common/stack/lambda-configs';
import {createSubscription} from 'digitraffic-common/stack/subscription';
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {DigitrafficStack} from "digitraffic-common/stack/stack";
import {TrafficType} from "digitraffic-common/model/traffictype";

export function create(
    secret: ISecret,
    stack: DigitrafficStack): Function {

    const functionName = "BridgeLockDisruption-UpdateDisruptions";
    const environment = stack.createDefaultLambdaEnvironment('BridgeLockDisruption');

    const lambdaConf = dbFunctionProps(stack, {
        functionName: functionName,
        code: new AssetCode('dist/lambda/update-disruptions'),
        handler: 'lambda-update-disruptions.handler',
        environment,
        timeout: 10,
    });

    const updateDisruptionsLambda = MonitoredFunction.create(stack, 'UpdateDisruptions', lambdaConf);

    secret.grantRead(updateDisruptionsLambda);

    const rule = new Rule(stack, 'Rule', {
        schedule: Schedule.rate(Duration.minutes(10))
    });
    rule.addTarget(new LambdaFunction(updateDisruptionsLambda));

    createSubscription(updateDisruptionsLambda, functionName, stack.configuration.logsDestinationArn, stack);

    return updateDisruptionsLambda;
}
