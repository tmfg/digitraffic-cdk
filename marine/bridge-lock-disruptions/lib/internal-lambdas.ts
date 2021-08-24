import {Rule,Schedule} from '@aws-cdk/aws-events';
import {Function,AssetCode} from '@aws-cdk/aws-lambda';
import {IVpc,ISecurityGroup} from '@aws-cdk/aws-ec2';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';
import {Stack, Duration} from '@aws-cdk/core';
import {dbLambdaConfiguration} from 'digitraffic-common/stack/lambda-configs';
import {createSubscription} from 'digitraffic-common/stack/subscription';
import {Props} from "./app-props";
import {ISecret} from "@aws-cdk/aws-secretsmanager";

export function create(
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: Props,
    secret: ISecret,
    stack: Stack): Function {

    const functionName = "BridgeLockDisruption-UpdateDisruptions";
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: new AssetCode('dist/lambda/update-disruptions'),
        handler: 'lambda-update-disruptions.handler',
        environment: {
            SECRET_ID: props.secretId
        }
    });

    const updateDisruptionsLambda = new Function(stack, 'UpdateDisruptions', lambdaConf);

    secret.grantRead(updateDisruptionsLambda);

    const rule = new Rule(stack, 'Rule', {
        schedule: Schedule.rate(Duration.minutes(10))
    });
    rule.addTarget(new LambdaFunction(updateDisruptionsLambda));

    createSubscription(updateDisruptionsLambda, functionName, props.logsDestinationArn, stack);

    return updateDisruptionsLambda;
}
