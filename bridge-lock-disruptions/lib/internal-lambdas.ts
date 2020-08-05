import {Rule,Schedule} from '@aws-cdk/aws-events';
import {Function,AssetCode} from '@aws-cdk/aws-lambda';
import {IVpc,ISecurityGroup} from '@aws-cdk/aws-ec2';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';
import {Stack, Duration} from '@aws-cdk/core';
import {dbLambdaConfiguration} from '../../common/stack/lambda-configs';
import {createSubscription} from '../../common/stack/subscription';
import {Props} from "./app-props";

export function create(
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: Props,
    stack: Stack): Function {

    const functionName = "BridgeLockDisruption-UpdateDisruptions";
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: new AssetCode('dist/lambda/update-disruptions'),
        handler: 'lambda-update-disruptions.handler',
        environment: {
            DB_USER: props.dbProps.username,
            DB_PASS: props.dbProps.password,
            DB_URI: props.dbProps.uri,
            ENDPOINT_URL: props.endpointUrl
        }
    });

    const updateDisruptionsLambda = new Function(stack, 'UpdateDisruptions', lambdaConf);

    const rule = new Rule(stack, 'Rule', {
        schedule: Schedule.rate(Duration.minutes(10))
    });
    rule.addTarget(new LambdaFunction(updateDisruptionsLambda));

    if(props.logsDestinationArn) {
        createSubscription(updateDisruptionsLambda, functionName, props.logsDestinationArn, stack);
    }

    return updateDisruptionsLambda;
}
