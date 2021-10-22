import {AssetCode, Runtime} from '@aws-cdk/aws-lambda';
import {Duration, Stack} from '@aws-cdk/core';
import {databaseFunctionProps, defaultLambdaConfiguration} from 'digitraffic-common/stack/lambda-configs';
import {DigitrafficLogSubscriptions} from 'digitraffic-common/stack/subscription';
import {Queue} from "@aws-cdk/aws-sqs";
import {SqsEventSource} from "@aws-cdk/aws-lambda-event-sources";
import {Bucket} from "@aws-cdk/aws-s3";
import {BUCKET_NAME} from "./lambda/process-dlq/lambda-process-dlq";
import {RetentionDays} from '@aws-cdk/aws-logs';
import {QueueAndDLQ} from "./sqs";
import {PolicyStatement} from "@aws-cdk/aws-iam";
import {Rule, Schedule} from "@aws-cdk/aws-events";
import {LambdaFunction} from "@aws-cdk/aws-events-targets";
import {PortactivityEnvKeys} from "./keys";
import {LambdaEnvironment} from "digitraffic-common/model/lambda-environment";
import {MonitoredFunction} from "digitraffic-common/lambda/monitoredfunction";
import {DigitrafficStack} from "digitraffic-common/stack/stack";

export function create(
    stack: DigitrafficStack,
    queueAndDLQ: QueueAndDLQ,
    dlqBucket: Bucket) {

    const cpqLambda = createProcessQueueLambda(queueAndDLQ.queue, stack);
    const dlqLambda = createProcessDLQLambda(dlqBucket, queueAndDLQ.dlq, stack);

    const updateAwakeAiTimestampsLambda = createUpdateAwakeAiTimestampsLambda(stack, queueAndDLQ.queue);
    const updateScheduleTimestampsLambda = createUpdateTimestampsFromSchedules(stack, queueAndDLQ.queue);
    const updateTimestampsFromPilotwebLambda = createUpdateTimestampsFromPilotwebLambda(stack, queueAndDLQ.queue);

    stack.grantSecret(cpqLambda, updateAwakeAiTimestampsLambda, updateScheduleTimestampsLambda, updateTimestampsFromPilotwebLambda);
    new DigitrafficLogSubscriptions(stack, cpqLambda, updateAwakeAiTimestampsLambda, updateScheduleTimestampsLambda, updateTimestampsFromPilotwebLambda);

    // create schedulers
    const updateETASchedulingRule = createETAScheduler(stack);
    const pilotwebScheduler = createPilotwebScheduler(stack);

    updateETASchedulingRule.addTarget(new LambdaFunction(updateAwakeAiTimestampsLambda));
    updateETASchedulingRule.addTarget(new LambdaFunction(updateScheduleTimestampsLambda));
    pilotwebScheduler.addTarget(new LambdaFunction(updateTimestampsFromPilotwebLambda));
}

function createUpdateTimestampsFromPilotwebLambda(stack: DigitrafficStack, queue: Queue): MonitoredFunction {
    const environment = stack.createLambdaEnvironment();
    environment[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] = queue.queueUrl;

    const lambda = MonitoredFunction.createV2(stack, 'update-timestamps-from-pilotweb', environment, {
        memorySize: 256,
        timeout: 10,
    });

    queue.grantSendMessages(lambda);

    return lambda;
}

// ATTENTION!
// This lambda needs to run in a VPC so that the outbound IP address is always the same (NAT Gateway).
// The reason for this is IP based restriction in another system's firewall.
function createUpdateTimestampsFromSchedules(stack: DigitrafficStack, queue: Queue): MonitoredFunction {
    const functionName = 'PortActivity-UpdateTimestampsFromSchedules';
    const environment = stack.createLambdaEnvironment();
    environment[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] = queue.queueUrl;

    const lambda = MonitoredFunction.create(stack, functionName, defaultLambdaConfiguration({
        functionName,
        timeout: 10,
        code: new AssetCode('dist/lambda/update-timestamps-from-schedules'),
        handler: 'lambda-update-timestamps-from-schedules.handler',
        environment,
        vpc: stack.vpc,
        vpcSubnets: stack.vpc.privateSubnets
    }));

    queue.grantSendMessages(lambda);

    return lambda;
}

function createProcessQueueLambda(
    queue: Queue,
    stack: DigitrafficStack): MonitoredFunction {
    const environment = stack.createLambdaEnvironment();
    const processQueueLambda = MonitoredFunction.createV2(stack, 'process-queue', environment, {
        timeout: 10,
        reservedConcurrentExecutions: 8
    });

    processQueueLambda.addEventSource(new SqsEventSource(queue));

    return processQueueLambda;
}

function createProcessDLQLambda(
    dlqBucket: Bucket,
    dlq: Queue,
    stack: DigitrafficStack): MonitoredFunction {

    const environment: LambdaEnvironment = {};
    environment[BUCKET_NAME] = dlqBucket.bucketName;

    const functionName = "PortActivity-ProcessTimestampsDLQ";
    const processDLQLambda = MonitoredFunction.create(stack, functionName, {
        runtime: Runtime.NODEJS_12_X,
        logRetention: RetentionDays.ONE_YEAR,
        functionName: functionName,
        code: new AssetCode('dist/lambda/process-dlq'),
        timeout: Duration.seconds(10),
        handler: 'lambda-process-dlq.handler',
        environment,
    });

    processDLQLambda.addEventSource(new SqsEventSource(dlq));

    const statement = new PolicyStatement();
    statement.addActions('s3:PutObject');
    statement.addActions('s3:PutObjectAcl');
    statement.addResources(dlqBucket.bucketArn + '/*');
    processDLQLambda.addToRolePolicy(statement);

    return processDLQLambda;
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

function createUpdateAwakeAiTimestampsLambda(stack: DigitrafficStack, queue: Queue): MonitoredFunction {
    const environment = stack.createLambdaEnvironment();
    environment[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] = queue.queueUrl;

    const functionName = 'PortActivity-UpdateAwakeAiETATimestamps';
    const lambdaConf = databaseFunctionProps(stack, environment, functionName, 'update-awake-ai-eta-timestamps', {
        timeout: 30,
    });
    const lambda = MonitoredFunction.create(stack, functionName, lambdaConf);

    queue.grantSendMessages(lambda);

    return lambda;
}
