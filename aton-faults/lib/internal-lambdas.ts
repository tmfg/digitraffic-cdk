import {Rule,Schedule} from '@aws-cdk/aws-events';
import {Function,AssetCode} from '@aws-cdk/aws-lambda';
import {IVpc,ISecurityGroup} from '@aws-cdk/aws-ec2';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';
import {Stack, Duration} from '@aws-cdk/core';
import {dbLambdaConfiguration} from '../../common/stack/lambda-configs';
import {createSubscription} from '../../common/stack/subscription';
import {AtonProps} from "./app-props";

export function create(
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonProps,
    stack: Stack): Function {

    const functionName = "ATON-UpdateFaults";
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        memorySize: 256,
        functionName: functionName,
        code: new AssetCode('dist/lambda/update-faults'),
        handler: 'lambda-update-faults.handler',
        environment: {
            DB_USER: props.dbProps.username,
            DB_PASS: props.dbProps.password,
            DB_URI: props.dbProps.uri,
            INTEGRATIONS: JSON.stringify(props.integrations)
        }
    });

    const updateFaultsLambda = new Function(stack, 'UpdateFaults', lambdaConf);

    const rule = new Rule(stack, 'Rule', {
        schedule: Schedule.rate(Duration.minutes(10))
    });
    rule.addTarget(new LambdaFunction(updateFaultsLambda));

    createSubscription(updateFaultsLambda, functionName, props.logsDestinationArn, stack);

    return updateFaultsLambda;
}
