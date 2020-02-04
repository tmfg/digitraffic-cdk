import * as events from '@aws-cdk/aws-events';
import * as lambda from '@aws-cdk/aws-lambda';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as targets from '@aws-cdk/aws-events-targets';
import {Stack, Duration} from '@aws-cdk/core';
import {dbLambdaConfiguration} from './cdk-util';
import {createSubscription} from '../../common/stack/subscription';

export function create(
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: NW2Props,
    stack: Stack): lambda.Function {

    const functionName = "NW2-UpdateAnnotations";
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: new lambda.AssetCode('dist/lambda/update-annotations'),
        handler: 'lambda-update-annotations.handler'
    });
    // @ts-ignore
    lambdaConf.environment.ENDPOINT_USER = props.integration.username;
    // @ts-ignore
    lambdaConf.environment.ENDPOINT_PASS = props.integration.password;
    // @ts-ignore
    lambdaConf.environment.ENDPOINT_URL = props.integration.url + "/annotations";
    // @ts-ignore
    lambdaConf.environment.ENDPOINT_LOGIN_URL = props.integration.url + "/login";

    const updateAnnotationsLambda = new lambda.Function(stack, 'UpdateAnnotations', lambdaConf);

    const rule = new events.Rule(stack, 'Rule', {
        schedule: events.Schedule.rate(Duration.minutes(10))
    });
    rule.addTarget(new targets.LambdaFunction(updateAnnotationsLambda));

    createSubscription(updateAnnotationsLambda, functionName, props.logsDestinationArn, stack);

    return updateAnnotationsLambda;
}
