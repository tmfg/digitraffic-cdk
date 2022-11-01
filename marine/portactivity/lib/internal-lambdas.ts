import { AssetCode, Runtime } from "aws-cdk-lib/aws-lambda";
import { Duration, Stack } from "aws-cdk-lib";
import {
    databaseFunctionProps,
    defaultLambdaConfiguration,
    LambdaEnvironment,
} from "@digitraffic/common/dist/aws/infra/stack/lambda-configs";
import { DigitrafficLogSubscriptions } from "@digitraffic/common/dist/aws/infra/stack/subscription";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { QueueAndDLQ } from "./sqs";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { LambdaSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { PortactivityEnvKeys } from "./keys";
import {
    MonitoredDBFunction,
    MonitoredFunction,
} from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { PortactivityConfiguration } from "./app-props";
import { Topic } from "aws-cdk-lib/aws-sns";
import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";

export function create(
    stack: DigitrafficStack,
    queueAndDLQ: QueueAndDLQ,
    dlqBucket: Bucket
) {
    const cpqLambda = createProcessQueueLambda(queueAndDLQ.queue, stack);
    createProcessDLQLambda(dlqBucket, queueAndDLQ.dlq, stack);

    const awakeETAShipUpdateTopicName = "UpdateAwakeShipETA";
    const triggerAwakeETAShipUpdateTopic = new Topic(
        stack,
        awakeETAShipUpdateTopicName,
        {
            topicName: awakeETAShipUpdateTopicName,
            displayName: awakeETAShipUpdateTopicName,
        }
    );
    const awakeETAPortUpdateTopicName = "UpdateAwakePortETA";
    const triggerAwakeETAPortUpdateTopic = new Topic(
        stack,
        awakeETAPortUpdateTopicName,
        {
            topicName: awakeETAPortUpdateTopicName,
            displayName: awakeETAPortUpdateTopicName,
        }
    );
    const triggerAwakeAiETAShipTimestampsLambda =
        createTriggerAwakeAiETATimestampsLambda(
            stack,
            triggerAwakeETAShipUpdateTopic,
            "trigger-awake-ai-eta-ship-timestamps-update"
        );
    const triggerAwakeAiETAPortTimestampsLambda =
        createTriggerAwakeAiETATimestampsLambda(
            stack,
            triggerAwakeETAPortUpdateTopic,
            "trigger-awake-ai-eta-port-timestamps-update"
        );
    const updateAwakeAiETAShipTimestampsLambda =
        createUpdateAwakeAiETATimestampsLambda(
            stack,
            triggerAwakeETAShipUpdateTopic,
            queueAndDLQ.queue,
            "PortActivity-UpdateAwakeAiETAShipTimestamps",
            "update-awake-ai-eta-ship-timestamps"
        );
    const updateAwakeAiETAPortTimestampsLambda =
        createUpdateAwakeAiETATimestampsLambda(
            stack,
            triggerAwakeETAPortUpdateTopic,
            queueAndDLQ.queue,
            "PortActivity-UpdateAwakeAiETAPortTimestamps",
            "update-awake-ai-eta-port-timestamps"
        );
    const updateScheduleTimestampsLambda = createUpdateTimestampsFromSchedules(
        stack,
        queueAndDLQ.queue
    );
    const updateTimestampsFromPilotwebLambda =
        createUpdateTimestampsFromPilotwebLambda(stack, queueAndDLQ.queue);
    const deleteOldTimestampsLambda = createDeleteOldTimestampsLambda(stack);

    stack.grantSecret(
        triggerAwakeAiETAShipTimestampsLambda,
        updateAwakeAiETAShipTimestampsLambda,
        updateAwakeAiETAPortTimestampsLambda,
        updateScheduleTimestampsLambda,
        updateTimestampsFromPilotwebLambda,
        deleteOldTimestampsLambda
    );
    new DigitrafficLogSubscriptions(
        stack,
        triggerAwakeAiETAShipTimestampsLambda,
        triggerAwakeAiETAPortTimestampsLambda,
        updateAwakeAiETAShipTimestampsLambda,
        updateAwakeAiETAPortTimestampsLambda,
        updateScheduleTimestampsLambda,
        updateTimestampsFromPilotwebLambda,
        deleteOldTimestampsLambda
    );

    Scheduler.everyMinutes(
        stack,
        "PortActivity-UpdateAwakeETAShipScheduler",
        10,
        triggerAwakeAiETAShipTimestampsLambda
    );
    if ((stack.configuration as PortactivityConfiguration).awakePortApi) {
        Scheduler.everyMinutes(
            stack,
            "PortActivity-UpdateAwakeETAPortScheduler",
            30,
            triggerAwakeAiETAPortTimestampsLambda
        );
    }
    Scheduler.everyMinutes(
        stack,
        "PortActivity-UpdateSchedulesScheduler",
        10,
        updateScheduleTimestampsLambda
    );
    Scheduler.everyMinutes(
        stack,
        "PortActivity-PilotwebScheduler",
        1,
        updateTimestampsFromPilotwebLambda
    );
    Scheduler.everyDay(
        stack,
        "PortActivity-DeleteOldTimestampsScheduler",
        deleteOldTimestampsLambda
    );

    if ((stack.configuration as PortactivityConfiguration).awakeATx) {
        const updateAwakeAiATXTimestampsLambda =
            createUpdateAwakeAiATXTimestampsLambda(stack, queueAndDLQ.queue);
        const updateATXSchedulingRule = createATXScheduler(stack);
        updateATXSchedulingRule.addTarget(
            new LambdaFunction(updateAwakeAiATXTimestampsLambda)
        );
        stack.grantSecret(updateAwakeAiATXTimestampsLambda);
        new DigitrafficLogSubscriptions(
            stack,
            updateAwakeAiATXTimestampsLambda
        );
    }
}

function createTriggerAwakeAiETATimestampsLambda(
    stack: DigitrafficStack,
    topic: Topic,
    lambdaName: string
) {
    const environment = stack.createLambdaEnvironment();
    environment[PortactivityEnvKeys.PUBLISH_TOPIC_ARN] = topic.topicArn;
    const lambda = MonitoredFunction.createV2(stack, lambdaName, environment, {
        memorySize: 128,
        timeout: 10,
        reservedConcurrentExecutions: 1,
    });
    topic.grantPublish(lambda);
    return lambda;
}

function createUpdateTimestampsFromPilotwebLambda(
    stack: DigitrafficStack,
    queue: Queue
): MonitoredFunction {
    const environment = stack.createLambdaEnvironment();
    environment[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] = queue.queueUrl;

    const lambda = MonitoredFunction.createV2(
        stack,
        "update-timestamps-from-pilotweb",
        environment,
        {
            memorySize: 256,
            timeout: 10,
        }
    );

    queue.grantSendMessages(lambda);

    return lambda;
}

function createDeleteOldTimestampsLambda(
    stack: DigitrafficStack
): MonitoredFunction {
    const environment = stack.createLambdaEnvironment();
    return MonitoredFunction.createV2(
        stack,
        "delete-old-timestamps",
        environment,
        {
            memorySize: 128,
            timeout: 5,
            reservedConcurrentExecutions: 1,
        }
    );
}

// ATTENTION!
// This lambda needs to run in a VPC so that the outbound IP address is always the same (NAT Gateway).
// The reason for this is IP based restriction in another system's firewall.
function createUpdateTimestampsFromSchedules(
    stack: DigitrafficStack,
    queue: Queue
): MonitoredFunction {
    const functionName = "PortActivity-UpdateTimestampsFromSchedules";
    const environment = stack.createLambdaEnvironment();
    environment[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] = queue.queueUrl;

    const lambda = MonitoredFunction.create(
        stack,
        functionName,
        defaultLambdaConfiguration({
            functionName,
            timeout: 10,
            code: new AssetCode("dist/lambda/update-timestamps-from-schedules"),
            handler: "lambda-update-timestamps-from-schedules.handler",
            environment,
            reservedConcurrentExecutions: 1,
            vpc: stack.vpc,
            vpcSubnets: {
                subnets: stack.vpc?.privateSubnets,
            },
        })
    );

    queue.grantSendMessages(lambda);

    return lambda;
}

function createProcessQueueLambda(
    queue: Queue,
    stack: DigitrafficStack
): MonitoredFunction {
    const processQueueLambda = MonitoredDBFunction.create(
        stack,
        "process-queue",
        undefined,
        {
            timeout: 10,
            reservedConcurrentExecutions: 10,
        }
    );

    processQueueLambda.addEventSource(new SqsEventSource(queue));

    return processQueueLambda;
}

function createProcessDLQLambda(
    dlqBucket: Bucket,
    dlq: Queue,
    stack: DigitrafficStack
): MonitoredFunction {
    const environment: LambdaEnvironment = {};
    environment[PortactivityEnvKeys.BUCKET_NAME] = dlqBucket.bucketName;

    const functionName = "PortActivity-ProcessTimestampsDLQ";
    const processDLQLambda = MonitoredFunction.create(stack, functionName, {
        runtime: Runtime.NODEJS_14_X,
        logRetention: RetentionDays.ONE_YEAR,
        functionName: functionName,
        code: new AssetCode("dist/lambda/process-dlq"),
        timeout: Duration.seconds(10),
        handler: "lambda-process-dlq.handler",
        reservedConcurrentExecutions: 3,
        memorySize: 128,
        environment,
    });

    processDLQLambda.addEventSource(new SqsEventSource(dlq));

    const statement = new PolicyStatement();
    statement.addActions("s3:PutObject");
    statement.addActions("s3:PutObjectAcl");
    statement.addResources(dlqBucket.bucketArn + "/*");
    processDLQLambda.addToRolePolicy(statement);

    return processDLQLambda;
}

function createATXScheduler(stack: Stack): Rule {
    const ruleName = "PortActivity-ATXScheduler";
    return new Rule(stack, ruleName, {
        ruleName,
        schedule: Schedule.expression("cron(*/10 * * * ? *)"), // every 10 minutes
    });
}

function createUpdateAwakeAiETATimestampsLambda(
    stack: DigitrafficStack,
    topic: Topic,
    queue: Queue,
    functionName: string,
    lambdaName: string
): MonitoredFunction {
    const environment = stack.createLambdaEnvironment();
    environment[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] = queue.queueUrl;
    const lambdaConf = databaseFunctionProps(
        stack,
        environment,
        functionName,
        lambdaName,
        {
            timeout: 30,
            reservedConcurrentExecutions: 14,
        }
    );
    const lambda = MonitoredFunction.create(stack, functionName, lambdaConf);
    topic.addSubscription(new LambdaSubscription(lambda));
    queue.grantSendMessages(lambda);
    return lambda;
}

function createUpdateAwakeAiATXTimestampsLambda(
    stack: DigitrafficStack,
    queue: Queue
): MonitoredFunction {
    const environment = stack.createDefaultLambdaEnvironment("PortActivity");
    environment[PortactivityEnvKeys.PORTACTIVITY_QUEUE_URL] = queue.queueUrl;

    const functionName = "PortActivity-UpdateAwakeAiATXTimestamps";
    const lambdaConf = databaseFunctionProps(
        stack,
        environment,
        functionName,
        "update-awake-ai-atx-timestamps",
        {
            timeout: 30,
        }
    );
    const lambda = MonitoredFunction.create(stack, functionName, lambdaConf, {
        durationWarningProps: {
            create: false, // this Lambda always executes close to the maximum duration
        },
    });

    queue.grantSendMessages(lambda);

    return lambda;
}
