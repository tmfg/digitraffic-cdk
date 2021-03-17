import {Rule,Schedule} from '@aws-cdk/aws-events';
import {Function,AssetCode} from '@aws-cdk/aws-lambda';
import {IVpc,ISecurityGroup} from '@aws-cdk/aws-ec2';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';
import {Stack, Duration} from '@aws-cdk/core';
import {dbLambdaConfiguration} from '../../../common/stack/lambda-configs';
import {createSubscription} from '../../../common/stack/subscription';
import {AtonProps} from "./app-props";
import {Topic} from "@aws-cdk/aws-sns";
import {LambdaSubscription} from "@aws-cdk/aws-sns-subscriptions";
import {
    KEY_SECRET_ID,
    KEY_CLIENT_CERTIFICATE_SECRETKEY,
    KEY_PRIVATE_KEY_SECRETKEY, KEY_CA_SECRETKEY
} from "./lambda/send-fault/lambda-send-fault";
import {KEY_SECRET_ID as KEY_SECRET_ID_AF, KEY_INTEGRATIONS} from "./lambda/update-faults/lambda-update-faults";

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

    const environment: any = {};
    environment[KEY_SECRET_ID_AF] = props.secretId;
    environment[KEY_INTEGRATIONS] = JSON.stringify(props.integrations);
    const functionName = "ATON-UpdateFaults";
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        memorySize: 512,
        functionName: functionName,
        code: new AssetCode('dist/lambda/update-faults'),
        handler: 'lambda-update-faults.handler',
        environment
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
    const environment = {} as any;
    environment[KEY_SECRET_ID] = props.secretId;
    environment[KEY_CLIENT_CERTIFICATE_SECRETKEY] = props.clientCertificateSecretKey;
    environment[KEY_PRIVATE_KEY_SECRETKEY] = props.privateKeySecretKey;
    environment[KEY_CA_SECRETKEY] = props.caSecretKey;
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
