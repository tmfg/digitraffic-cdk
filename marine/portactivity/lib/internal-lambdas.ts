import {AssetCode, Runtime} from '@aws-cdk/aws-lambda';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {Duration, Stack} from '@aws-cdk/core';
import {dbLambdaConfiguration, defaultLambdaConfiguration} from 'digitraffic-common/stack/lambda-configs';
import {createSubscription} from 'digitraffic-common/stack/subscription';
import {Props} from "./app-props";
import {Queue} from "@aws-cdk/aws-sqs";
import {SqsEventSource} from "@aws-cdk/aws-lambda-event-sources";
import {Bucket} from "@aws-cdk/aws-s3";
import {BUCKET_NAME} from "./lambda/process-dlq/lambda-process-dlq";
import {RetentionDays} from '@aws-cdk/aws-logs';
import {QueueAndDLQ} from "./sqs";
import {PolicyStatement} from "@aws-cdk/aws-iam";
import {Rule, Schedule} from "@aws-cdk/aws-events";
import {LambdaFunction} from "@aws-cdk/aws-events-targets";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {PortactivityEnvKeys} from "./keys";
import {DatabaseEnvironmentKeys} from "digitraffic-common/secrets/dbsecret";
import {LambdaEnvironment} from "digitraffic-common/model/lambda-environment";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction"
import {ITopic} from "@aws-cdk/aws-sns";

export function create(
    queueAndDLQ: QueueAndDLQ,
    dlqBucket: Bucket,
    secret: ISecret,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    alarmTopic: ITopic,
    warningTopic: ITopic,
    props: Props,
    stack: Stack) {

    createProcessQueueLambda(queueAndDLQ.queue, secret, vpc, lambdaDbSg, alarmTopic, warningTopic, props, stack);
    createProcessDLQLambda(dlqBucket, queueAndDLQ.dlq, alarmTopic, warningTopic, props, stack);

    const updateAwakeAiTimestampsLambda = createUpdateAwakeAiTimestampsLambda(
        secret,
        queueAndDLQ.queue,
        vpc,
        lambdaDbSg,
        alarmTopic,
        warningTopic,
        props,
        stack);
    const updateScheduleTimestampsLambda = createUpdateTimestampsFromSchedules(
        secret,
        queueAndDLQ.queue,
        vpc,
        alarmTopic,
        warningTopic,
        props,
        stack);

    const updateETASchedulingRule = createETAScheduler(stack);
    updateETASchedulingRule.addTarget(new LambdaFunction(updateAwakeAiTimestampsLambda));
    updateETASchedulingRule.addTarget(new LambdaFunction(updateScheduleTimestampsLambda));

    if(props.sources?.pilotweb) {
        const updateTimestampsFromPilotwebLambda = createUpdateTimestampsFromPilotwebLambda(
            secret,
            queueAndDLQ.queue,
            vpc,
            lambdaDbSg,
            alarmTopic,
            warningTopic,
            props,
            stack);
        const pilotwebScheduler = createPilotwebScheduler(stack);
        pilotwebScheduler.addTarget(new LambdaFunction(updateTimestampsFromPilotwebLambda));
    }
}

function createUpdateTimestampsFromPilotwebLambda(
    secret: ISecret,
    queue: Queue,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    alarmTopic: ITopic,
    warningTopic: ITopic,
    props: Props,
    stack: Stack) {

    const functionName = 'PortActivity-UpdateTimestampsFromPilotweb';
    const environment: LambdaEnvironment = {};
    environment[PortactivityEnvKeys.SECRET_ID] = props.secretId;
    environment[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] = queue.queueUrl;
    environment[DatabaseEnvironmentKeys.DB_APPLICATION] = 'PortActivity';

    const lambda = new MonitoredFunction(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props,{
        memorySize: 256,
        reservedConcurrentExecutions: 1,
        timeout: 10,
        functionName,
        code: new AssetCode('dist/lambda/update-timestamps-from-pilotweb'),
        handler: 'lambda-update-timestamps-from-pilotweb.handler',
        environment
    }), alarmTopic, warningTopic);

    createSubscription(lambda, functionName, props.logsDestinationArn, stack);
    queue.grantSendMessages(lambda);

    secret.grantRead(lambda);

    return lambda;
}

// ATTENTION!
// This lambda needs to run in a VPC so that the outbound IP address is always the same (NAT Gateway).
// The reason for this is IP based restriction in another system's firewall.
function createUpdateTimestampsFromSchedules(
    secret: ISecret,
    queue: Queue,
    vpc: IVpc,
    alarmTopic: ITopic,
    warningTopic: ITopic,
    props: Props,
    stack: Stack) {

    const functionName = 'PortActivity-UpdateTimestampsFromSchedules';
    const environment: LambdaEnvironment = {};
    environment[PortactivityEnvKeys.SECRET_ID] = props.secretId;
    environment[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] = queue.queueUrl;
    environment[DatabaseEnvironmentKeys.DB_APPLICATION] = 'PortActivity';

    const lambda = new MonitoredFunction(stack, functionName, defaultLambdaConfiguration({
        functionName,
        timeout: 10,
        reservedConcurrentExecutions: 1,
        code: new AssetCode('dist/lambda/update-timestamps-from-schedules'),
        handler: 'lambda-update-timestamps-from-schedules.handler',
        environment,
        vpc,
        vpcSubnets: vpc.privateSubnets
    }), alarmTopic, warningTopic);

    createSubscription(lambda, functionName, props.logsDestinationArn, stack);
    queue.grantSendMessages(lambda);

    secret.grantRead(lambda);

    return lambda;
}

function createProcessQueueLambda(
    queue: Queue,
    secret: ISecret,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    alarmTopic: ITopic,
    warningTopic: ITopic,
    props: Props,
    stack: Stack) {

    const functionName = "PortActivity-ProcessTimestampQueue";
    const environment: LambdaEnvironment = {};
    environment[PortactivityEnvKeys.SECRET_ID] = props.secretId;
    environment[DatabaseEnvironmentKeys.DB_APPLICATION] = 'PortActivity';

    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName,
        memorySize: 128,
        code: new AssetCode('dist/lambda/process-queue'),
        handler: 'lambda-process-queue.handler',
        environment,
        timeout: 10,
        reservedConcurrentExecutions: 7
    });
    const processQueueLambda = new MonitoredFunction(stack, functionName, lambdaConf, alarmTopic, warningTopic);
    secret.grantRead(processQueueLambda);
    processQueueLambda.addEventSource(new SqsEventSource(queue));
    createSubscription(processQueueLambda, functionName, props.logsDestinationArn, stack);
}

function createProcessDLQLambda(
    dlqBucket: Bucket,
    dlq: Queue,
    alarmTopic: ITopic,
    warningTopic: ITopic,
    props: Props,
    stack: Stack) {

    const lambdaEnv: LambdaEnvironment = {};
    lambdaEnv[BUCKET_NAME] = dlqBucket.bucketName;
    const functionName = "PortActivity-ProcessTimestampsDLQ";
    const processDLQLambda = new MonitoredFunction(stack, functionName, {
        runtime: Runtime.NODEJS_12_X,
        logRetention: RetentionDays.ONE_YEAR,
        functionName: functionName,
        code: new AssetCode('dist/lambda/process-dlq'),
        timeout: Duration.seconds(10),
        handler: 'lambda-process-dlq.handler',
        environment: lambdaEnv,
        reservedConcurrentExecutions: 1
    }, alarmTopic, warningTopic);

    processDLQLambda.addEventSource(new SqsEventSource(dlq));
    createSubscription(processDLQLambda, functionName, props.logsDestinationArn, stack);

    const statement = new PolicyStatement();
    statement.addActions('s3:PutObject');
    statement.addActions('s3:PutObjectAcl');
    statement.addResources(dlqBucket.bucketArn + '/*');
    processDLQLambda.addToRolePolicy(statement);
}

function createETAScheduler(stack: Stack): Rule {
    const ruleName = 'PortActivity-ETAScheduler'
    return new Rule(stack, ruleName, {
        ruleName,
        schedule: Schedule.expression('cron(*/10 * * * ? *)') // every 10 minutes
    });
}

function createPilotwebScheduler(stack: Stack): Rule {
    const ruleName = 'PortActivity-PilotwebScheduler'
    return new Rule(stack, ruleName, {
        ruleName,
        schedule: Schedule.expression('cron(*/1 * * * ? *)') // every minute
    });
}

function createUpdateAwakeAiTimestampsLambda(
    secret: ISecret,
    queue: Queue,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    alarmTopic: ITopic,
    warningTopic: ITopic,
    props: Props,
    stack: Stack) {

    const environment: LambdaEnvironment = {};
    environment[PortactivityEnvKeys.SECRET_ID] = props.secretId;
    environment[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] = queue.queueUrl;
    environment[DatabaseEnvironmentKeys.DB_APPLICATION] = 'PortActivity';

    const functionName = 'PortActivity-UpdateAwakeAiTimestamps';
    const lambdaConf = dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName,
        memorySize: 128,
        code: new AssetCode('dist/lambda/update-awake-ai-timestamps'),
        handler: 'lambda-update-awake-ai-timestamps.handler',
        timeout: 30,
        environment,
        reservedConcurrentExecutions: 1
    });
    const lambda = new MonitoredFunction(stack, functionName, lambdaConf, alarmTopic, warningTopic);

    secret.grantRead(lambda);
    queue.grantSendMessages(lambda);

    createSubscription(lambda, functionName, props.logsDestinationArn, stack);

    return lambda;
}
