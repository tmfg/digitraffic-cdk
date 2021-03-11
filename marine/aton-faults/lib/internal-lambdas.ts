import {Rule,Schedule} from '@aws-cdk/aws-events';
import {Function,AssetCode} from '@aws-cdk/aws-lambda';
import {IVpc,ISecurityGroup} from '@aws-cdk/aws-ec2';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';
import {Stack, Duration} from '@aws-cdk/core';
import {dbLambdaConfiguration} from '../../../common/stack/lambda-configs';
import {createSubscription} from '../../../common/stack/subscription';
import {AtonProps} from "./app-props";
import {Topic} from "@aws-cdk/aws-sns";
import {KEY_SEND_FAULT_SNS_TOPIC_ARN} from "./lambda/upload-voyage-plan/lambda-upload-voyage-plan";
import {LambdaSubscription} from "@aws-cdk/aws-sns-subscriptions";

export function create(
    sendFaultTopic: Topic,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonProps,
    stack: Stack) {

    createUpdateFaultsLambda(vpc, lambdaDbSg, props, stack);
    createSendFaultLambda(sendFaultTopic, vpc, lambdaDbSg, props, stack);
}

function createUpdateFaultsLambda(
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonProps,
    stack: Stack) {

    const functionName = "ATON-UpdateFaults";
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        memorySize: 512,
        functionName: functionName,
        code: new AssetCode('dist/lambda/update-faults'),
        handler: 'lambda-update-faults.handler',
        environment: {
            DB_USER: props.dbProps?.username,
            DB_PASS: props.dbProps?.password,
            DB_URI: props.dbProps?.uri,
            INTEGRATIONS: JSON.stringify(props.integrations)
        }
    });

    const updateFaultsLambda = new Function(stack, 'UpdateFaults', lambdaConf);

    const rule = new Rule(stack, 'Rule', {
        schedule: Schedule.rate(Duration.minutes(10))
    });
    rule.addTarget(new LambdaFunction(updateFaultsLambda));

    createSubscription(updateFaultsLambda, functionName, props.logsDestinationArn, stack);
}

function createSendFaultLambda(
    sendFaultTopic: Topic,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonProps,
    stack: Stack) {

    const functionName = "ATON-SendFault";
    const environment = {
        DB_USER: props.dbProps?.username,
        DB_PASS: props.dbProps?.password,
        DB_URI: props.dbProps?.uri
    } as any;
    environment[KEY_SEND_FAULT_SNS_TOPIC_ARN] = sendFaultTopic.topicArn
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        memorySize: 256,
        functionName: functionName,
        code: new AssetCode('dist/lambda/send-fault'),
        handler: 'lambda-send-fault.handler',
        environment
    });

    const lambda = new Function(stack, functionName, lambdaConf);

    sendFaultTopic.addSubscription(new LambdaSubscription(lambda));

    createSubscription(lambda, functionName, props.logsDestinationArn, stack);
}
