import {Rule,Schedule} from '@aws-cdk/aws-events';
import {Function,AssetCode} from '@aws-cdk/aws-lambda';
import {IVpc,ISecurityGroup} from '@aws-cdk/aws-ec2';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';
import {Stack, Duration} from '@aws-cdk/core';
import {dbLambdaConfiguration} from './cdk-util';
import {createSubscription} from '../../common/stack/subscription';

export function create(
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: NW2Props,
    stack: Stack): Function {

    const functionName = "NW2-UpdateAnnotations";
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: new AssetCode('dist/lambda/update-annotations'),
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

    const updateAnnotationsLambda = new Function(stack, 'UpdateAnnotations', lambdaConf);

    const rule = new Rule(stack, 'Rule', {
        schedule: Schedule.rate(Duration.minutes(10))
    });
    rule.addTarget(new LambdaFunction(updateAnnotationsLambda));

    createSubscription(updateAnnotationsLambda, functionName, props.logsDestinationArn, stack);

    return updateAnnotationsLambda;
}
